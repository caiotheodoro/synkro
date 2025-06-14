export type NotificationType =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "SUCCESS"
  | "ALERT";
export type NotificationChannel =
  | "email"
  | "push"
  | "sms"
  | "in_app"
  | "webhook";
export type NotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "read"
  | "cancelled";

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
  priority?: "low" | "normal" | "high" | "urgent";
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

export interface NotificationRule {
  id: string;
  eventType: string;
  conditions: Record<string, any>;
  channels: string[];
  template?: string;
  priority: "low" | "normal" | "high" | "urgent";
  throttle?: {
    maxPerHour?: number;
    maxPerDay?: number;
  };
}
