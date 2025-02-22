export type NotificationType = "INFO" | "WARNING" | "ERROR" | "SUCCESS";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  userId?: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateNotificationDto {
  type: NotificationType;
  message: string;
  userId?: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}
