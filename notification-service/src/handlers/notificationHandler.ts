import { NotificationEvent, NotificationChannel } from "../types";
import { notificationService } from "../services/notificationService";
import { emailHandler } from "./emailHandler";
import { websocketHandler } from "./websocketHandler";

export class NotificationHandler {
  private readonly channelHandlers: Map<
    NotificationChannel,
    (event: NotificationEvent) => Promise<void>
  > = new Map();

  constructor() {
    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.channelHandlers.set("email", this.handleEmailNotification.bind(this));
    this.channelHandlers.set("push", this.handlePushNotification.bind(this));
    this.channelHandlers.set("in_app", this.handleInAppNotification.bind(this));
    this.channelHandlers.set("sms", this.handleSMSNotification.bind(this));
    this.channelHandlers.set(
      "webhook",
      this.handleWebhookNotification.bind(this)
    );
  }

  async processEvent(event: NotificationEvent): Promise<void> {
    console.log(`Processing notification event: ${event.eventType}`);

    try {
      const channels = this.determineChannels(event);

      for (const channel of channels) {
        const handler = this.channelHandlers.get(channel);
        if (handler) {
          await handler(event);
        } else {
          console.warn(`No handler found for channel: ${channel}`);
        }
      }
    } catch (error) {
      console.error(`Error processing event ${event.eventType}:`, error);
      throw error;
    }
  }

  private determineChannels(event: NotificationEvent): NotificationChannel[] {
    const eventTypeChannelMap: Record<string, NotificationChannel[]> = {
      "inventory.low_stock": ["email", "in_app"],
      "inventory.out_of_stock": ["email", "push", "in_app"],
      "user.welcome": ["email", "in_app"],
      "user.password_reset": ["email"],
      "system.maintenance": ["email", "in_app", "push"],
      "alert.critical": ["email", "push", "sms", "in_app"],
      "order.completed": ["email", "push", "in_app"],
      "order.shipped": ["email", "push", "in_app"],
    };

    return eventTypeChannelMap[event.eventType] || ["in_app"];
  }

  private async handleEmailNotification(
    event: NotificationEvent
  ): Promise<void> {
    console.log(`Handling email notification for event: ${event.eventType}`);

    const notification = await notificationService.createNotification({
      type: this.getNotificationType(event.eventType),
      channel: "email",
      recipientId: event.userId,
      tenantId: event.tenantId,
      subject: this.generateSubject(event),
      message: this.generateMessage(event),
      metadata: {
        eventType: event.eventType,
        originalData: event.data,
        email:
          event.data.email || event.data.contactEmail || "admin@synkro.com",
      },
    });

    // Actually send the email using the email handler
    try {
      await emailHandler.sendEmail(notification);
    } catch (error) {
      console.error(
        `Failed to send email notification ${notification.id}:`,
        error
      );
    }

    console.log(`Processed email notification: ${notification.id}`);
  }

  private async handlePushNotification(
    event: NotificationEvent
  ): Promise<void> {
    console.log(`Handling push notification for event: ${event.eventType}`);

    const notification = await notificationService.createNotification({
      type: this.getNotificationType(event.eventType),
      channel: "push",
      recipientId: event.userId,
      tenantId: event.tenantId,
      subject: this.generateSubject(event),
      message: this.generateMessage(event),
      metadata: {
        eventType: event.eventType,
        originalData: event.data,
      },
    });

    console.log(`Created push notification: ${notification.id}`);
  }

  private async handleInAppNotification(
    event: NotificationEvent
  ): Promise<void> {
    console.log(`Handling in-app notification for event: ${event.eventType}`);

    const notification = await notificationService.createNotification({
      type: this.getNotificationType(event.eventType),
      channel: "in_app",
      recipientId: event.userId,
      tenantId: event.tenantId,
      subject: this.generateSubject(event),
      message: this.generateMessage(event),
      metadata: {
        eventType: event.eventType,
        originalData: event.data,
      },
    });

    // Send real-time notification via WebSocket
    try {
      await websocketHandler.sendNotification(notification);
    } catch (error) {
      console.error(
        `Failed to send WebSocket notification ${notification.id}:`,
        error
      );
    }

    console.log(`Processed in-app notification: ${notification.id}`);
  }

  private async handleSMSNotification(event: NotificationEvent): Promise<void> {
    console.log(`Handling SMS notification for event: ${event.eventType}`);

    const notification = await notificationService.createNotification({
      type: this.getNotificationType(event.eventType),
      channel: "sms",
      recipientId: event.userId,
      tenantId: event.tenantId,
      message: this.generateMessage(event),
      metadata: {
        eventType: event.eventType,
        originalData: event.data,
      },
    });

    console.log(`Created SMS notification: ${notification.id}`);
  }

  private async handleWebhookNotification(
    event: NotificationEvent
  ): Promise<void> {
    console.log(`Handling webhook notification for event: ${event.eventType}`);

    const notification = await notificationService.createNotification({
      type: this.getNotificationType(event.eventType),
      channel: "webhook",
      recipientId: event.userId,
      tenantId: event.tenantId,
      message: JSON.stringify(event.data),
      metadata: {
        eventType: event.eventType,
        originalData: event.data,
      },
    });

    console.log(`Created webhook notification: ${notification.id}`);
  }

  private getNotificationType(
    eventType: string
  ): "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "ALERT" {
    const typeMap: Record<
      string,
      "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "ALERT"
    > = {
      "inventory.low_stock": "WARNING",
      "inventory.out_of_stock": "ERROR",
      "user.welcome": "INFO",
      "user.password_reset": "INFO",
      "system.maintenance": "WARNING",
      "alert.critical": "ALERT",
      "order.completed": "SUCCESS",
      "order.shipped": "INFO",
    };

    return typeMap[eventType] || "INFO";
  }

  private generateSubject(event: NotificationEvent): string {
    const subjectMap: Record<string, string> = {
      "inventory.low_stock": `Low Stock Alert: ${
        event.data.itemName ?? "Item"
      }`,
      "inventory.out_of_stock": `Out of Stock: ${
        event.data.itemName ?? "Item"
      }`,
      "user.welcome": "Welcome to Synkro!",
      "user.password_reset": "Password Reset Request",
      "system.maintenance": "Scheduled Maintenance Notice",
      "alert.critical": "Critical Alert",
      "order.completed": `Order Completed: ${
        event.data.orderNumber ?? "Order"
      }`,
      "order.shipped": `Order Shipped: ${event.data.orderNumber ?? "Order"}`,
    };

    return subjectMap[event.eventType] || "Notification";
  }

  private generateMessage(event: NotificationEvent): string {
    const messageMap: Record<string, (data: any) => string> = {
      "inventory.low_stock": (data) =>
        `The item "${data.itemName}" (SKU: ${data.sku}) is running low with only ${data.currentStock} units remaining. Threshold: ${data.threshold}.`,
      "inventory.out_of_stock": (data) =>
        `The item "${data.itemName}" (SKU: ${data.sku}) is now out of stock in ${data.warehouseName}.`,
      "user.welcome": (data) =>
        `Welcome to Synkro, ${data.userName}! We're excited to have you on board.`,
      "user.password_reset": (data) =>
        `A password reset has been requested for your account. If this wasn't you, please contact support.`,
      "system.maintenance": (data) =>
        `Scheduled maintenance is planned for ${data.scheduledDate}. Expected downtime: ${data.duration}.`,
      "alert.critical": (data) =>
        `Critical alert: ${data.message}. Immediate attention required.`,
      "order.completed": (data) =>
        `Your order ${data.orderNumber} has been completed and is ready for processing.`,
      "order.shipped": (data) =>
        `Your order ${data.orderNumber} has been shipped. Tracking number: ${data.trackingNumber}.`,
    };

    const messageGenerator = messageMap[event.eventType];
    return messageGenerator
      ? messageGenerator(event.data)
      : JSON.stringify(event.data);
  }
}

export const notificationHandler = new NotificationHandler();
