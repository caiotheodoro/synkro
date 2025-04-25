import { CreateNotificationDto, Notification } from "../types";
import { Counter } from "prom-client";

const notificationsCounter = new Counter({
  name: "notifications_sent_total",
  help: "Total number of notifications sent",
  labelNames: ["type"],
});

class NotificationService {
  private readonly notifications: Notification[] = [];

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      ...dto,
      createdAt: new Date(),
    };

    this.notifications.push(notification);
    notificationsCounter.inc({ type: dto.type });

    return notification;
  }

  async getNotifications(
    tenantId: string,
    userId?: string
  ): Promise<Notification[]> {
    return this.notifications.filter(
      (n) => n.tenantId === tenantId && (!userId || n.userId === userId)
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
}

export const notificationService = new NotificationService();
