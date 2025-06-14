import { CreateNotificationDto, Notification } from "../types";
import { Counter } from "prom-client";

const notificationsCounter = new Counter({
  name: "notifications_sent_total",
  help: "Total number of notifications sent",
  labelNames: ["type", "channel", "status"],
});

class NotificationService {
  private readonly notifications: Notification[] = [];

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: dto.type,
      channel: dto.channel,
      recipientId: dto.recipientId,
      tenantId: dto.tenantId,
      subject: dto.subject,
      message: dto.message,
      templateId: dto.templateId,
      templateVariables: dto.templateVariables,
      status: "pending",
      deliveryAttempts: 0,
      maxAttempts: 3,
      scheduledAt: dto.scheduledAt,
      sentAt: undefined,
      deliveredAt: undefined,
      readAt: undefined,
      errorMessage: undefined,
      externalId: undefined,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notifications.push(notification);
    notificationsCounter.inc({
      type: dto.type,
      channel: dto.channel,
      status: "created",
    });

    return notification;
  }

  async getNotifications(
    tenantId: string,
    userId?: string
  ): Promise<Notification[]> {
    return this.notifications.filter(
      (n) => n.tenantId === tenantId && (!userId || n.recipientId === userId)
    );
  }

  async deleteNotification(id: string, tenantId: string): Promise<boolean> {
    const index = this.notifications.findIndex(
      (n) => n.id === id && n.tenantId === tenantId
    );
    if (index === -1) return false;

    this.notifications.splice(index, 1);
    return true;
  }

  async updateNotificationStatus(
    id: string,
    status: Notification["status"],
    updates?: Partial<Notification>
  ): Promise<void> {
    const notification = this.notifications.find((n) => n.id === id);
    if (!notification) return;

    notification.status = status;
    notification.updatedAt = new Date();

    if (updates) {
      Object.assign(notification, updates);
    }

    notificationsCounter.inc({
      type: notification.type,
      channel: notification.channel,
      status,
    });
  }
}

export const notificationService = new NotificationService();
