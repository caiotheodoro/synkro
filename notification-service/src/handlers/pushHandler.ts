import admin from "firebase-admin";
import { Notification } from "../types";
import { notificationService } from "../services/notificationService";

interface DeviceToken {
  userId: string;
  tenantId: string;
  token: string;
  platform: "ios" | "android" | "web";
  lastUsed: Date;
}

export class PushHandler {
  private isInitialized = false;
  private deviceTokens: Map<string, DeviceToken[]> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      );

      if (!projectId || !clientEmail || !privateKey) {
        console.warn(
          "Firebase credentials not set - push notifications will be logged only"
        );
        console.log("To enable Firebase push notifications:");
        console.log(
          "1. Create a Firebase project at https://console.firebase.google.com/"
        );
        console.log("2. Go to Project Settings > Service Accounts");
        console.log("3. Generate a new private key");
        console.log(
          "4. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables"
        );
        return;
      }

      // Validate private key format
      if (!privateKey.includes("BEGIN PRIVATE KEY")) {
        console.warn(
          "Invalid Firebase private key format - push notifications will be logged only"
        );
        return;
      }

      // Check if Firebase app is already initialized
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }

      this.isInitialized = true;
      console.log("Push notification handler initialized with Firebase FCM");
    } catch (error) {
      console.warn(
        "Failed to initialize Firebase - push notifications will be logged only:",
        error instanceof Error ? error.message : String(error)
      );
      this.isInitialized = false;
    }
  }

  async sendPushNotification(notification: Notification): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log(`Push notification logged: ${notification.subject}`);
        console.log(`To: ${notification.recipientId}`);
        console.log(`Message: ${notification.message}`);

        await notificationService.updateNotificationStatus(
          notification.id,
          "sent",
          {
            sentAt: new Date(),
            metadata: { ...notification.metadata, simulatedSend: true },
          }
        );
        return;
      }

      const tokens = this.getUserTokens(
        notification.recipientId!,
        notification.tenantId
      );

      if (tokens.length === 0) {
        console.log(`No FCM tokens found for user ${notification.recipientId}`);
        await notificationService.updateNotificationStatus(
          notification.id,
          "sent",
          {
            sentAt: new Date(),
            metadata: { ...notification.metadata, reason: "no_device_tokens" },
          }
        );
        return;
      }

      const message = this.buildFCMMessage(
        notification,
        tokens.map((t) => t.token)
      );

      console.log(
        `Sending push notification to ${tokens.length} devices for user ${notification.recipientId}`
      );
      const response = await admin.messaging().sendEachForMulticast(message);

      await this.processResponse(response, tokens, notification);
    } catch (error) {
      console.error("Push notification sending failed:", error);

      await notificationService.updateNotificationStatus(
        notification.id,
        "failed",
        {
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unknown push notification error",
          metadata: { ...notification.metadata, error },
        }
      );

      throw error;
    }
  }

  private buildFCMMessage(notification: Notification, tokens: string[]) {
    const eventType = notification.metadata?.eventType || "notification";
    const originalData = notification.metadata?.originalData || {};

    return {
      tokens,
      notification: {
        title: notification.subject || "Synkro Notification",
        body: this.truncateMessage(notification.message, 100),
      },
      data: {
        notificationId: notification.id,
        eventType,
        tenantId: notification.tenantId,
        recipientId: notification.recipientId || "",
        type: notification.type,
        timestamp: notification.createdAt.toISOString(),
        ...this.sanitizeDataForFCM(originalData),
      },
      android: {
        priority: "high" as const,
        notification: {
          icon: "ic_notification",
          color: "#667eea",
          sound: "default",
          channelId: this.getChannelId(notification.type),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            category: eventType,
          },
        },
      },
      webpush: {
        notification: {
          icon: "/icons/notification-icon.png",
          badge: "/icons/badge-icon.png",
          requireInteraction: notification.type === "ALERT",
        },
      },
    };
  }

  private async processResponse(
    response: admin.messaging.BatchResponse,
    tokens: DeviceToken[],
    notification: Notification
  ) {
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        successCount++;
        // Update token last used time
        tokens[idx].lastUsed = new Date();
      } else {
        failureCount++;
        const error = resp.error;

        if (
          error?.code === "messaging/registration-token-not-registered" ||
          error?.code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[idx].token);
        }

        console.error(
          `Push notification failed for token ${idx}:`,
          error?.message
        );
      }
    });

    // Remove invalid tokens
    if (invalidTokens.length > 0) {
      await this.removeInvalidTokens(invalidTokens);
      console.log(`Removed ${invalidTokens.length} invalid FCM tokens`);
    }

    const status = successCount > 0 ? "delivered" : "failed";
    await notificationService.updateNotificationStatus(
      notification.id,
      status,
      {
        deliveredAt: successCount > 0 ? new Date() : undefined,
        sentAt: new Date(),
        metadata: {
          ...notification.metadata,
          fcmResponse: {
            successCount,
            failureCount,
            totalTokens: tokens.length,
            invalidTokensRemoved: invalidTokens.length,
          },
        },
      }
    );

    console.log(
      `Push notification result: ${successCount}/${tokens.length} delivered successfully`
    );
  }

  private getChannelId(type: string): string {
    const channelMap = {
      INFO: "general",
      WARNING: "alerts",
      ERROR: "critical",
      SUCCESS: "updates",
      ALERT: "critical",
    };
    return channelMap[type as keyof typeof channelMap] || "general";
  }

  private truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + "...";
  }

  private sanitizeDataForFCM(data: any): Record<string, string> {
    const sanitized: Record<string, string> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        sanitized[key] = String(value);
      } else if (value !== null && value !== undefined) {
        sanitized[key] = JSON.stringify(value);
      }
    });

    return sanitized;
  }

  // Device token management methods
  async registerDeviceToken(
    userId: string,
    tenantId: string,
    token: string,
    platform: "ios" | "android" | "web"
  ): Promise<void> {
    const userKey = `${tenantId}:${userId}`;

    if (!this.deviceTokens.has(userKey)) {
      this.deviceTokens.set(userKey, []);
    }

    const tokens = this.deviceTokens.get(userKey)!;

    // Remove existing token if it exists
    const existingIndex = tokens.findIndex((t) => t.token === token);
    if (existingIndex > -1) {
      tokens.splice(existingIndex, 1);
    }

    // Add new token
    tokens.push({
      userId,
      tenantId,
      token,
      platform,
      lastUsed: new Date(),
    });

    console.log(`Registered FCM token for user ${userId} on ${platform}`);
  }

  async unregisterDeviceToken(
    userId: string,
    tenantId: string,
    token: string
  ): Promise<void> {
    const userKey = `${tenantId}:${userId}`;
    const tokens = this.deviceTokens.get(userKey);

    if (tokens) {
      const index = tokens.findIndex((t) => t.token === token);
      if (index > -1) {
        tokens.splice(index, 1);
        console.log(`Unregistered FCM token for user ${userId}`);
      }
    }
  }

  private getUserTokens(userId: string, tenantId: string): DeviceToken[] {
    const userKey = `${tenantId}:${userId}`;
    return this.deviceTokens.get(userKey) || [];
  }

  private async removeInvalidTokens(invalidTokens: string[]): Promise<void> {
    this.deviceTokens.forEach((tokens, userKey) => {
      const validTokens = tokens.filter(
        (t) => !invalidTokens.includes(t.token)
      );
      if (validTokens.length !== tokens.length) {
        this.deviceTokens.set(userKey, validTokens);
      }
    });
  }

  // Statistics and management
  getTokenStats(): {
    totalTokens: number;
    tokensByPlatform: Record<string, number>;
    tokensByUser: Record<string, number>;
  } {
    let totalTokens = 0;
    const tokensByPlatform: Record<string, number> = {};
    const tokensByUser: Record<string, number> = {};

    this.deviceTokens.forEach((tokens, userKey) => {
      totalTokens += tokens.length;
      tokensByUser[userKey] = tokens.length;

      tokens.forEach((token) => {
        tokensByPlatform[token.platform] =
          (tokensByPlatform[token.platform] || 0) + 1;
      });
    });

    return { totalTokens, tokensByPlatform, tokensByUser };
  }

  async cleanupOldTokens(maxAgeHours: number = 720): Promise<number> {
    // 30 days default
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let removedCount = 0;

    this.deviceTokens.forEach((tokens, userKey) => {
      const validTokens = tokens.filter((t) => t.lastUsed > cutoffDate);
      removedCount += tokens.length - validTokens.length;
      this.deviceTokens.set(userKey, validTokens);
    });

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old FCM tokens`);
    }

    return removedCount;
  }
}

export const pushHandler = new PushHandler();
