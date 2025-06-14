import { WebSocketServer, WebSocket } from "ws";
import { NotificationEvent, Notification } from "../types";
import { notificationService } from "../services/notificationService";

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  tenantId: string;
  lastPing: number;
  subscriptions: Set<string>;
}

export class WebSocketHandler {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection[]> = new Map();
  private heartbeatInterval: Timer | null = null;

  constructor(private port: number = 3006) {
    this.initialize();
  }

  private initialize() {
    try {
      this.wss = new WebSocketServer({ port: this.port });
      this.setupWebSocketServer();
      this.startHeartbeat();
      console.log(`WebSocket server started on port ${this.port}`);
    } catch (error) {
      console.error("Failed to initialize WebSocket server:", error);
    }
  }

  private setupWebSocketServer() {
    if (!this.wss) return;

    this.wss.on("connection", (ws, request) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const userId = url.searchParams.get("userId");
      const tenantId = url.searchParams.get("tenantId");
      const token = url.searchParams.get("token");

      if (!userId || !tenantId) {
        ws.close(1008, "Missing userId or tenantId parameters");
        return;
      }

      // For now, accept any token - in production, validate with API Gateway
      if (!token) {
        ws.close(1008, "Missing authentication token");
        return;
      }

      const clientKey = `${tenantId}:${userId}`;
      const client: ClientConnection = {
        ws,
        userId,
        tenantId,
        lastPing: Date.now(),
        subscriptions: new Set(["notifications", "events"]),
      };

      // Add client to connections map
      if (!this.clients.has(clientKey)) {
        this.clients.set(clientKey, []);
      }
      this.clients.get(clientKey)!.push(client);

      console.log(
        `WebSocket client connected: ${clientKey} (${
          this.clients.get(clientKey)?.length
        } total connections)`
      );

      // Send welcome message
      this.sendToClient(client, {
        type: "connected",
        data: {
          message: "Connected to Synkro notifications",
          clientId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      });

      // Handle incoming messages
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(client, message);
        } catch (error) {
          console.error("Invalid message from client:", error);
        }
      });

      // Handle pong responses
      ws.on("pong", () => {
        client.lastPing = Date.now();
      });

      // Handle client disconnect
      ws.on("close", () => {
        this.removeClient(clientKey, client);
        console.log(`WebSocket client disconnected: ${clientKey}`);
      });

      ws.on("error", (error) => {
        console.error("WebSocket client error:", error);
        this.removeClient(clientKey, client);
      });
    });
  }

  private handleClientMessage(client: ClientConnection, message: any) {
    switch (message.type) {
      case "ping":
        this.sendToClient(client, { type: "pong", timestamp: Date.now() });
        break;

      case "subscribe":
        if (message.eventTypes && Array.isArray(message.eventTypes)) {
          message.eventTypes.forEach((eventType: string) => {
            client.subscriptions.add(eventType);
          });
          this.sendToClient(client, {
            type: "subscribed",
            eventTypes: Array.from(client.subscriptions),
          });
        }
        break;

      case "unsubscribe":
        if (message.eventTypes && Array.isArray(message.eventTypes)) {
          message.eventTypes.forEach((eventType: string) => {
            client.subscriptions.delete(eventType);
          });
          this.sendToClient(client, {
            type: "unsubscribed",
            eventTypes: Array.from(client.subscriptions),
          });
        }
        break;

      default:
        console.log("Unknown message type from client:", message.type);
    }
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      const recipientKey = `${notification.tenantId}:${notification.recipientId}`;
      const clients = this.clients.get(recipientKey) || [];

      if (clients.length === 0) {
        console.log(`No WebSocket clients found for ${recipientKey}`);
        await notificationService.updateNotificationStatus(
          notification.id,
          "sent",
          {
            sentAt: new Date(),
            metadata: {
              ...notification.metadata,
              reason: "no_active_connections",
            },
          }
        );
        return;
      }

      const eventType = notification.metadata?.eventType || "notification";
      const message = {
        type: "notification",
        data: {
          id: notification.id,
          type: notification.type,
          eventType,
          subject: notification.subject,
          message: notification.message,
          timestamp: notification.createdAt,
          metadata: notification.metadata,
        },
      };

      let deliveredCount = 0;
      clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          // Check if client is subscribed to this event type
          if (
            client.subscriptions.has(eventType) ||
            client.subscriptions.has("notifications")
          ) {
            this.sendToClient(client, message);
            deliveredCount++;
          }
        }
      });

      await notificationService.updateNotificationStatus(
        notification.id,
        "delivered",
        {
          deliveredAt: new Date(),
          sentAt: new Date(),
          metadata: {
            ...notification.metadata,
            deliveredToClients: deliveredCount,
            totalClients: clients.length,
          },
        }
      );

      console.log(
        `Real-time notification delivered to ${deliveredCount}/${clients.length} clients for ${recipientKey}`
      );
    } catch (error) {
      console.error("WebSocket notification sending failed:", error);

      await notificationService.updateNotificationStatus(
        notification.id,
        "failed",
        {
          errorMessage:
            error instanceof Error ? error.message : "Unknown WebSocket error",
          metadata: { ...notification.metadata, error },
        }
      );

      throw error;
    }
  }

  private sendToClient(client: ClientConnection, message: any) {
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error("Error sending message to client:", error);
    }
  }

  private removeClient(clientKey: string, clientToRemove: ClientConnection) {
    const clients = this.clients.get(clientKey);
    if (clients) {
      const index = clients.indexOf(clientToRemove);
      if (index > -1) {
        clients.splice(index, 1);
        if (clients.length === 0) {
          this.clients.delete(clientKey);
        }
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      this.clients.forEach((clients, key) => {
        clients.forEach((client) => {
          if (now - client.lastPing > 35000) {
            console.log(`Terminating inactive client: ${key}`);
            client.ws.terminate();
            this.removeClient(key, client);
          } else if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.ping();
          }
        });
      });
    }, 15000);
  }

  getConnectedClients(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.clients.forEach((clients, key) => {
      stats[key] = clients.filter(
        (c) => c.ws.readyState === WebSocket.OPEN
      ).length;
    });
    return stats;
  }

  getClientCount(): number {
    let total = 0;
    this.clients.forEach((clients) => {
      total += clients.filter((c) => c.ws.readyState === WebSocket.OPEN).length;
    });
    return total;
  }

  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.wss) {
      this.wss.clients.forEach((ws) => {
        ws.close(1001, "Server shutting down");
      });
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    console.log("WebSocket server shut down");
  }
}

export const websocketHandler = new WebSocketHandler();
