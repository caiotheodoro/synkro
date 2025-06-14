# Notification Service Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for the Synkro Notification Service. The service is designed to handle real-time notifications across multiple channels (email, push notifications, in-app notifications) with event-driven architecture, high availability, and seamless integration with other Synkro microservices.

## Current State Analysis

### Existing Implementation
- **Runtime**: Bun with Elysia framework
- **Language**: TypeScript
- **Current Features**:
  - Basic REST API for notification CRUD operations
  - In-memory storage (temporary)
  - Prometheus metrics integration
  - Health and readiness checks
  - Multi-tenant support
- **Missing Features**:
  - Event-driven architecture
  - Multiple notification channels
  - Persistent storage
  - Message queuing
  - Email/Push notification providers
  - Real-time delivery

## Technology Stack Recommendations

### Core Technologies

1. **Runtime & Framework**
   - **Keep**: Bun + Elysia (excellent performance, TypeScript native)
   - **Rationale**: Bun provides superior performance for I/O operations, perfect for notification handling

2. **Message Queue**
   - **Recommended**: RabbitMQ (already in architecture)
   - **Alternative**: Redis Pub/Sub for simpler scenarios
   - **Rationale**: Reliable message delivery, dead letter queues, routing capabilities

3. **Database**
   - **Primary**: PostgreSQL (for notification history, user preferences)
   - **Cache**: Redis (for real-time data, rate limiting)
   - **Rationale**: Consistency with existing architecture

4. **Notification Providers**
   - **Email**: SendGrid or AWS SES
   - **Push Notifications**: Firebase Cloud Messaging (FCM)
   - **SMS**: Twilio (future enhancement)
   - **WebSocket**: Socket.io or native WebSocket

5. **Additional Libraries**
   - **Queue Processing**: `bullmq` or `bee-queue`
   - **Email Templates**: `handlebars` or `mustache`
   - **WebSocket**: `ws` or `socket.io`
   - **Validation**: `zod` (already used in other services)

## Architecture Design

### High-Level Architecture

```mermaid
graph TB
    %% External Services
    subgraph External["External Services"]
        SendGrid["SendGrid/SES<br/>Email Provider"]
        FCM["Firebase FCM<br/>Push Notifications"]
        Twilio["Twilio<br/>SMS Provider"]
    end
    
    %% Notification Service Components
    subgraph NotificationService["Notification Service"]
        API["REST API<br/>(Elysia)"]
        EventHandler["Event Handler<br/>(RabbitMQ Consumer)"]
        NotificationEngine["Notification Engine<br/>(Core Logic)"]
        ChannelHandlers["Channel Handlers"]
        WebSocketServer["WebSocket Server<br/>(Real-time)"]
        
        subgraph Channels["Channel Handlers"]
            EmailHandler["Email Handler"]
            PushHandler["Push Handler"]
            InAppHandler["In-App Handler"]
            SMSHandler["SMS Handler"]
        end
    end
    
    %% Data Layer
    subgraph DataLayer["Data Layer"]
        PostgreSQL[("PostgreSQL<br/>Notification History")]
        Redis[("Redis<br/>Cache & Sessions")]
        RabbitMQ{"RabbitMQ<br/>Event Queue"}
    end
    
    %% Other Services
    subgraph OtherServices["Other Synkro Services"]
        APIGateway["API Gateway"]
        MLService["ML Service"]
        InventoryService["Inventory Service"]
    end
    
    %% Frontend
    subgraph Frontend["Frontend Applications"]
        Dashboard["Dashboard App"]
        Mobile["Mobile App"]
    end
    
    %% Connections
    OtherServices -->|"Events"| RabbitMQ
    RabbitMQ -->|"Consume"| EventHandler
    EventHandler --> NotificationEngine
    NotificationEngine --> ChannelHandlers
    
    EmailHandler --> SendGrid
    PushHandler --> FCM
    SMSHandler --> Twilio
    InAppHandler --> WebSocketServer
    
    WebSocketServer <--> Frontend
    API <--> Frontend
    APIGateway <--> API
    
    NotificationService --> PostgreSQL
    NotificationService --> Redis
```

### Event-Driven Flow

```mermaid
sequenceDiagram
    participant IS as Inventory Service
    participant RMQ as RabbitMQ
    participant NS as Notification Service
    participant DB as PostgreSQL
    participant EP as Email Provider
    participant WS as WebSocket
    participant FE as Frontend

    %% Event Generation
    IS->>RMQ: Publish Event<br/>(low_stock_alert)
    
    %% Event Processing
    RMQ->>NS: Consume Event
    NS->>NS: Process Event Rules
    NS->>DB: Save Notification
    
    %% Multi-channel Delivery
    par Email Notification
        NS->>EP: Send Email
        EP-->>NS: Delivery Status
    and Real-time Notification
        NS->>WS: Push to WebSocket
        WS->>FE: Real-time Update
    and In-App Notification
        NS->>DB: Store In-App Notification
    end
    
    NS->>DB: Update Delivery Status
```

## Implementation Phases

### Phase 1: Foundation & Event Infrastructure (Week 1-2)

#### 1.1 Database Schema Design

```sql
-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- email, push, sms, in_app
    subject VARCHAR(255),
    template_content TEXT NOT NULL,
    variables JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    channel VARCHAR(50) NOT NULL, -- email, push, sms, in_app
    event_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    settings JSONB, -- channel-specific settings
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id, channel, event_type)
);

-- Notification history (enhanced)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient_id UUID,
    tenant_id UUID NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    template_id UUID REFERENCES notification_templates(id),
    template_variables JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed, read
    delivery_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    external_id VARCHAR(255), -- provider-specific ID
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification events (for audit and retry)
CREATE TABLE notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id),
    event_type VARCHAR(50) NOT NULL, -- created, sent, delivered, failed, read
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_tenant_recipient ON notifications(tenant_id, recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id, tenant_id);
```

#### 1.2 Enhanced Type Definitions

```typescript
// src/types/index.ts
export type NotificationType = "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "ALERT";
export type NotificationChannel = "email" | "push" | "sms" | "in_app" | "webhook";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed" | "read" | "cancelled";

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationChannel;
  subject?: string;
  templateContent: string;
  variables?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  tenantId: string;
  channel: NotificationChannel;
  eventType: string;
  enabled: boolean;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipientId?: string;
  tenantId: string;
  subject?: string;
  message: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  status: NotificationStatus;
  deliveryAttempts: number;
  maxAttempts: number;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationEvent {
  eventType: string;
  tenantId: string;
  userId?: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
}

export interface CreateNotificationDto {
  type: NotificationType;
  channel: NotificationChannel;
  recipientId?: string;
  tenantId: string;
  subject?: string;
  message: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}
```

#### 1.3 RabbitMQ Integration

```typescript
// src/services/messageQueue.ts
import amqp from 'amqplib';

export class MessageQueueService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Declare exchanges
      await this.channel.assertExchange('notifications', 'topic', { durable: true });
      await this.channel.assertExchange('notifications.dlx', 'direct', { durable: true });
      
      // Declare queues
      await this.channel.assertQueue('notifications.email', {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'notifications.dlx',
          'x-dead-letter-routing-key': 'failed'
        }
      });
      
      await this.channel.assertQueue('notifications.push', {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'notifications.dlx',
          'x-dead-letter-routing-key': 'failed'
        }
      });
      
      await this.channel.assertQueue('notifications.in_app', {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'notifications.dlx',
          'x-dead-letter-routing-key': 'failed'
        }
      });
      
      await this.channel.assertQueue('notifications.failed', { durable: true });
      
      // Bind queues
      await this.channel.bindQueue('notifications.email', 'notifications', 'email.*');
      await this.channel.bindQueue('notifications.push', 'notifications', 'push.*');
      await this.channel.bindQueue('notifications.in_app', 'notifications', 'in_app.*');
      await this.channel.bindQueue('notifications.failed', 'notifications.dlx', 'failed');
      
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publishEvent(routingKey: string, event: NotificationEvent): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    
    const message = Buffer.from(JSON.stringify(event));
    await this.channel.publish('notifications', routingKey, message, {
      persistent: true,
      timestamp: Date.now(),
      messageId: crypto.randomUUID()
    });
  }

  async consumeQueue(queueName: string, handler: (event: NotificationEvent) => Promise<void>): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
    
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;
      
      try {
        const event = JSON.parse(msg.content.toString()) as NotificationEvent;
        await handler(event);
        this.channel!.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);
        this.channel!.nack(msg, false, false); // Send to DLX
      }
    });
  }
}
```

### Phase 2: Channel Handlers Implementation (Week 3-4)

#### 2.1 Email Handler

```typescript
// src/handlers/emailHandler.ts
import sgMail from '@sendgrid/mail';
import { NotificationEvent, Notification } from '../types';
import { templateService } from '../services/templateService';

export class EmailHandler {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async handle(event: NotificationEvent): Promise<void> {
    try {
      const notification = await this.createNotification(event);
      const emailContent = await this.prepareEmail(notification);
      
      const msg = {
        to: event.data.email,
        from: process.env.FROM_EMAIL!,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      const response = await sgMail.send(msg);
      
      await this.updateNotificationStatus(notification.id, 'sent', {
        externalId: response[0].headers['x-message-id'],
        sentAt: new Date()
      });
      
    } catch (error) {
      await this.handleError(event, error);
    }
  }

  private async prepareEmail(notification: Notification) {
    if (notification.templateId) {
      return await templateService.renderTemplate(
        notification.templateId,
        notification.templateVariables || {}
      );
    }
    
    return {
      subject: notification.subject || 'Notification',
      html: notification.message,
      text: notification.message.replace(/<[^>]*>/g, '')
    };
  }
}
```

#### 2.2 Push Notification Handler

```typescript
// src/handlers/pushHandler.ts
import admin from 'firebase-admin';
import { NotificationEvent } from '../types';

export class PushHandler {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  async handle(event: NotificationEvent): Promise<void> {
    try {
      const tokens = await this.getUserTokens(event.userId!, event.tenantId);
      
      if (tokens.length === 0) {
        console.log('No FCM tokens found for user');
        return;
      }

      const message = {
        notification: {
          title: event.data.title || 'Synkro Notification',
          body: event.data.message,
        },
        data: {
          eventType: event.eventType,
          tenantId: event.tenantId,
          ...event.data,
        },
        tokens,
      };

      const response = await admin.messaging().sendMulticast(message);
      
      await this.processResponse(response, tokens, event);
      
    } catch (error) {
      await this.handleError(event, error);
    }
  }

  private async processResponse(response: admin.messaging.BatchResponse, tokens: string[], event: NotificationEvent) {
    response.responses.forEach(async (resp, idx) => {
      if (resp.success) {
        // Update notification status
      } else {
        // Handle failed tokens, potentially remove invalid ones
        if (resp.error?.code === 'messaging/registration-token-not-registered') {
          await this.removeInvalidToken(tokens[idx], event.userId!);
        }
      }
    });
  }
}
```

#### 2.3 WebSocket Handler for Real-time Notifications

```typescript
// src/handlers/websocketHandler.ts
import { WebSocketServer, WebSocket } from 'ws';
import { NotificationEvent } from '../types';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  tenantId: string;
  lastPing: number;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection[]> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const userId = url.searchParams.get('userId');
      const tenantId = url.searchParams.get('tenantId');
      const token = url.searchParams.get('token');

      if (!userId || !tenantId || !token) {
        ws.close(1008, 'Missing required parameters');
        return;
      }

      // Validate token with API Gateway
      this.validateToken(token).then(valid => {
        if (!valid) {
          ws.close(1008, 'Invalid token');
          return;
        }

        const clientKey = `${tenantId}:${userId}`;
        const client: ClientConnection = {
          ws,
          userId,
          tenantId,
          lastPing: Date.now()
        };

        if (!this.clients.has(clientKey)) {
          this.clients.set(clientKey, []);
        }
        this.clients.get(clientKey)!.push(client);

        ws.on('pong', () => {
          client.lastPing = Date.now();
        });

        ws.on('close', () => {
          this.removeClient(clientKey, client);
        });
      });
    });
  }

  async handle(event: NotificationEvent): Promise<void> {
    const clientKey = `${event.tenantId}:${event.userId}`;
    const clients = this.clients.get(clientKey) || [];

    const message = JSON.stringify({
      type: 'notification',
      data: {
        id: crypto.randomUUID(),
        eventType: event.eventType,
        message: event.data.message,
        timestamp: new Date().toISOString(),
        ...event.data
      }
    });

    clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  private startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      this.clients.forEach((clients, key) => {
        clients.forEach(client => {
          if (now - client.lastPing > 30000) {
            client.ws.terminate();
            this.removeClient(key, client);
          } else {
            client.ws.ping();
          }
        });
      });
    }, 10000);
  }
}
```

### Phase 3: Advanced Features (Week 5-6)

#### 3.1 Template Service

```typescript
// src/services/templateService.ts
import Handlebars from 'handlebars';
import { NotificationTemplate } from '../types';

export class TemplateService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  async renderTemplate(templateId: string, variables: Record<string, any>) {
    const template = await this.getTemplate(templateId);
    
    return {
      subject: template.subject ? Handlebars.compile(template.subject)(variables) : '',
      html: Handlebars.compile(template.templateContent)(variables),
      text: this.htmlToText(Handlebars.compile(template.templateContent)(variables))
    };
  }

  private async getTemplate(templateId: string): Promise<NotificationTemplate> {
    // Fetch from database with caching
    // Implementation details...
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
```

#### 3.2 Notification Rules Engine

```typescript
// src/services/rulesEngine.ts
export interface NotificationRule {
  id: string;
  eventType: string;
  conditions: Record<string, any>;
  channels: string[];
  template?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  throttle?: {
    maxPerHour?: number;
    maxPerDay?: number;
  };
}

export class RulesEngine {
  async processEvent(event: NotificationEvent): Promise<NotificationRule[]> {
    const rules = await this.getRulesForEvent(event.eventType);
    
    return rules.filter(rule => this.evaluateConditions(rule.conditions, event.data));
  }

  private evaluateConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    // Implement condition evaluation logic
    // Support for operators like eq, gt, lt, in, contains, etc.
    return true;
  }
}
```

### Phase 4: Integration & Testing (Week 7-8)

#### 4.1 API Gateway Integration

```typescript
// Integration with existing API Gateway for authentication
export class AuthService {
  async validateToken(token: string): Promise<{ valid: boolean; userId?: string; tenantId?: string }> {
    try {
      const response = await fetch(`${process.env.API_GATEWAY_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { valid: true, userId: data.userId, tenantId: data.tenantId };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('Token validation failed:', error);
      return { valid: false };
    }
  }
}
```

#### 4.2 Event Publishers for Other Services

```typescript
// Example: Inventory Service Integration
export class InventoryEventPublisher {
  constructor(private messageQueue: MessageQueueService) {}

  async publishLowStockAlert(item: InventoryItem, warehouse: Warehouse) {
    const event: NotificationEvent = {
      eventType: 'inventory.low_stock',
      tenantId: item.tenantId,
      data: {
        itemName: item.name,
        sku: item.sku,
        currentStock: item.quantity,
        threshold: item.lowStockThreshold,
        warehouseName: warehouse.name,
        email: warehouse.contactEmail
      },
      priority: 'high'
    };

    await this.messageQueue.publishEvent('email.inventory', event);
    await this.messageQueue.publishEvent('in_app.inventory', event);
  }
}
```

## Configuration & Environment Variables

```bash
# .env
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/synkro_notifications
REDIS_URL=redis://localhost:6379

# Message Queue
RABBITMQ_URL=amqp://localhost:5672

# Email Provider
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=notifications@synkro.com

# Push Notifications
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# SMS (Future)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# API Gateway
API_GATEWAY_URL=http://api-gateway-auth:3000

# WebSocket
WEBSOCKET_PORT=3001

# Monitoring
PROMETHEUS_PORT=9090
```

## Deployment Strategy

### Docker Configuration

```dockerfile
# Dockerfile
FROM oven/bun:1 as base
WORKDIR /usr/src/app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM oven/bun:1-slim
WORKDIR /usr/src/app

COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/package.json ./

EXPOSE 3000 3001

CMD ["bun", "run", "dist/main.js"]
```

### Kubernetes Deployment

```yaml
# k8s/notification-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  labels:
    app: notification-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: ghcr.io/synkro/notification-service:latest
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 3001
          name: websocket
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: notification-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: notification-config
              key: redis-url
        - name: RABBITMQ_URL
          valueFrom:
            configMapKeyRef:
              name: notification-config
              key: rabbitmq-url
        resources:
          requests:
            cpu: "200m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readiness
            port: http
          initialDelaySeconds: 15
          periodSeconds: 5
```

## Monitoring & Observability

### Metrics

```typescript
// src/metrics/index.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const notificationMetrics = {
  sent: new Counter({
    name: 'notifications_sent_total',
    help: 'Total notifications sent',
    labelNames: ['channel', 'type', 'status']
  }),
  
  processingTime: new Histogram({
    name: 'notification_processing_duration_seconds',
    help: 'Time spent processing notifications',
    labelNames: ['channel', 'type']
  }),
  
  queueSize: new Gauge({
    name: 'notification_queue_size',
    help: 'Current queue size',
    labelNames: ['queue']
  }),
  
  activeConnections: new Gauge({
    name: 'websocket_active_connections',
    help: 'Active WebSocket connections'
  })
};
```

### Health Checks

```typescript
// Enhanced health checks
app.get('/health', async () => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkRabbitMQ(),
    checkEmailProvider(),
    checkPushProvider()
  ]);
  
  const healthy = checks.every(check => check.status === 'fulfilled');
  
  return {
    status: healthy ? 'healthy' : 'unhealthy',
    checks: checks.map((check, index) => ({
      service: ['database', 'redis', 'rabbitmq', 'email', 'push'][index],
      status: check.status,
      error: check.status === 'rejected' ? check.reason : undefined
    })),
    timestamp: new Date().toISOString()
  };
});
```

## Testing Strategy

### Unit Tests

```typescript
// tests/services/notificationService.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { NotificationService } from '../src/services/notificationService';

describe('NotificationService', () => {
  let service: NotificationService;
  
  beforeEach(() => {
    service = new NotificationService();
  });
  
  it('should create notification with correct data', async () => {
    const dto = {
      type: 'INFO' as const,
      channel: 'email' as const,
      tenantId: 'test-tenant',
      message: 'Test message'
    };
    
    const notification = await service.createNotification(dto);
    
    expect(notification.id).toBeDefined();
    expect(notification.type).toBe('INFO');
    expect(notification.status).toBe('pending');
  });
});
```

### Integration Tests

```typescript
// tests/integration/api.test.ts
import { describe, it, expect } from 'bun:test';
import { Elysia } from 'elysia';

describe('Notification API', () => {
  it('should create notification via API', async () => {
    const app = new Elysia()
      .post('/api/v1/notifications', async ({ body }) => {
        // Test implementation
      });
    
    const response = await app.handle(
      new Request('http://localhost/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INFO',
          channel: 'email',
          tenantId: 'test',
          message: 'Test'
        })
      })
    );
    
    expect(response.status).toBe(201);
  });
});
```

## Security Considerations

1. **Authentication**: All API endpoints require valid JWT tokens
2. **Authorization**: Tenant-based access control
3. **Rate Limiting**: Prevent notification spam
4. **Input Validation**: Sanitize all inputs
5. **Secrets Management**: Use Kubernetes secrets for sensitive data
6. **Encryption**: TLS for all communications
7. **Audit Logging**: Track all notification activities

## Performance Optimization

1. **Connection Pooling**: Database and Redis connections
2. **Caching**: Template and preference caching
3. **Batch Processing**: Group similar notifications
4. **Queue Management**: Priority queues for urgent notifications
5. **Horizontal Scaling**: Multiple service instances
6. **Circuit Breakers**: Prevent cascade failures

## Migration Plan

1. **Phase 1**: Deploy new service alongside existing
2. **Phase 2**: Migrate existing notifications to new schema
3. **Phase 3**: Update other services to use new event system
4. **Phase 4**: Deprecate old notification endpoints
5. **Phase 5**: Full cutover and monitoring

## Success Metrics

- **Delivery Rate**: >99% successful delivery
- **Latency**: <2 seconds for real-time notifications
- **Throughput**: Handle 10,000+ notifications/minute
- **Availability**: 99.9% uptime
- **Error Rate**: <0.1% processing errors

This implementation plan provides a comprehensive roadmap for building a production-ready notification service that integrates seamlessly with the existing Synkro architecture while providing scalability, reliability, and excellent user experience. 