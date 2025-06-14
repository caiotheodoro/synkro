import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { register, collectDefaultMetrics } from "prom-client";
import { notificationService } from "./services/notificationService";
import { messageQueueService } from "./services/messageQueue";
import { notificationHandler } from "./handlers/notificationHandler";
import { websocketHandler } from "./handlers/websocketHandler";
import { pushHandler } from "./handlers/pushHandler";
import { templateService } from "./services/templateService";

collectDefaultMetrics();

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Synkro Notification Service API",
          version: "1.0.0",
          description:
            "Event-driven notification service supporting multiple channels",
        },
      },
    })
  )
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "notification-service",
    version: "1.0.0",
  }))
  .get("/readiness", () => {
    const checks = {
      messageQueue: messageQueueService.connected,
      service: true,
    };
    const isReady = Object.values(checks).every((check) => check);
    return {
      status: isReady ? "ready" : "not ready",
      checks,
      timestamp: new Date().toISOString(),
    };
  })
  .get("/metrics", async () => {
    return new Response(await register.metrics(), {
      headers: {
        "Content-Type": register.contentType,
      },
    });
  })
  .get("/api/v1/stats", async () => {
    const notifications = notificationService.getAllNotifications();
    const queueConnected = messageQueueService.connected;
    const wsConnectedClients = websocketHandler.getConnectedClients();
    const wsClientCount = websocketHandler.getClientCount();

    return {
      totalNotifications: notifications.length,
      notificationsByType: notifications.reduce(
        (acc: Record<string, number>, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        },
        {}
      ),
      notificationsByChannel: notifications.reduce(
        (acc: Record<string, number>, n) => {
          acc[n.channel] = (acc[n.channel] || 0) + 1;
          return acc;
        },
        {}
      ),
      notificationsByStatus: notifications.reduce(
        (acc: Record<string, number>, n) => {
          acc[n.status] = (acc[n.status] || 0) + 1;
          return acc;
        },
        {}
      ),
      queueConnected,
      websocket: {
        totalClients: wsClientCount,
        clientsByUser: wsConnectedClients,
      },
      pushNotifications: pushHandler.getTokenStats(),
      templates: templateService.getTemplateStats(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  })
  .post("/api/v1/push/register", async (context) => {
    try {
      const { userId, tenantId, token, platform } = context.body as any;
      await pushHandler.registerDeviceToken(userId, tenantId, token, platform);
      return { success: true, message: "Device token registered" };
    } catch (error) {
      console.error("Error registering device token:", error);
      return { error: "Failed to register device token" };
    }
  })
  .delete("/api/v1/push/unregister", async (context) => {
    try {
      const { userId, tenantId, token } = context.body as any;
      await pushHandler.unregisterDeviceToken(userId, tenantId, token);
      return { success: true, message: "Device token unregistered" };
    } catch (error) {
      console.error("Error unregistering device token:", error);
      return { error: "Failed to unregister device token" };
    }
  })
  .get("/api/v1/templates", async () => {
    try {
      return templateService.getAvailableTemplates();
    } catch (error) {
      console.error("Error getting templates:", error);
      return { error: "Failed to get templates" };
    }
  })
  .post("/api/v1/templates", async (context) => {
    try {
      const template = await templateService.createTemplate(
        context.body as any
      );
      return template;
    } catch (error) {
      console.error("Error creating template:", error);
      return { error: "Failed to create template" };
    }
  })
  .put("/api/v1/templates/:id", async (context) => {
    try {
      const { id } = context.params || {};
      const template = await templateService.updateTemplate(
        id,
        context.body as any
      );
      return template || { error: "Template not found" };
    } catch (error) {
      console.error("Error updating template:", error);
      return { error: "Failed to update template" };
    }
  })
  .delete("/api/v1/templates/:id", async (context) => {
    try {
      const { id } = context.params || {};
      const success = await templateService.deleteTemplate(id);
      return {
        success,
        message: success ? "Template deleted" : "Template not found",
      };
    } catch (error) {
      console.error("Error deleting template:", error);
      return { error: "Failed to delete template" };
    }
  })
  .post("/api/v1/notifications", async (context) => {
    try {
      return await notificationService.createNotification(context.body as any);
    } catch (error) {
      console.error("Error creating notification:", error);
      return { error: "Failed to create notification" };
    }
  })
  .post("/api/v1/events", async (context) => {
    try {
      const event = context.body as any;
      console.log(`📤 Publishing event: ${event.eventType}`);

      await notificationHandler.processEvent(event);

      if (messageQueueService.connected) {
        const channels = determineChannelsForEvent(event.eventType);
        for (const channel of channels) {
          const routingKey = `${channel}.${event.eventType.replace(".", "_")}`;
          await messageQueueService.publishEvent(routingKey, event);
        }
      }

      return {
        success: true,
        message: "Event published successfully",
        eventType: event.eventType,
      };
    } catch (error) {
      console.error("Error publishing event:", error);
      return { error: "Failed to publish event" };
    }
  })
  .get("/api/v1/notifications/:tenantId", async (context) => {
    try {
      const tenantId = context.params?.tenantId;
      const userId = context.query?.userId;
      return await notificationService.getNotifications(tenantId, userId);
    } catch (error) {
      console.error("Error getting notifications:", error);
      return { error: "Failed to get notifications" };
    }
  })
  .delete("/api/v1/notifications/:tenantId/:id", async (context) => {
    try {
      const { tenantId, id } = context.params || {};
      const success = await notificationService.deleteNotification(
        id,
        tenantId
      );
      return {
        success,
        message: success ? "Notification deleted" : "Notification not found",
      };
    } catch (error) {
      console.error("Error deleting notification:", error);
      return { error: "Failed to delete notification" };
    }
  })
  .patch("/api/v1/notifications/:id/status", async (context) => {
    try {
      const { id } = context.params || {};
      const body = context.body as any;
      await notificationService.updateNotificationStatus(
        id,
        body?.status,
        body?.updates
      );
      return { success: true, message: "Notification status updated" };
    } catch (error) {
      console.error("Error updating notification status:", error);
      return { error: "Failed to update notification status" };
    }
  });

function determineChannelsForEvent(eventType: string): string[] {
  const eventTypeChannelMap: Record<string, string[]> = {
    "inventory.low_stock": ["email", "in_app"],
    "inventory.out_of_stock": ["email", "push", "in_app"],
    "user.welcome": ["email", "in_app"],
    "user.password_reset": ["email"],
    "system.maintenance": ["email", "in_app", "push"],
    "alert.critical": ["email", "push", "sms", "in_app"],
    "order.completed": ["email", "push", "in_app"],
    "order.shipped": ["email", "push", "in_app"],
  };
  return eventTypeChannelMap[eventType] || ["in_app"];
}

async function initializeServices() {
  console.log("🚀 Initializing Notification Service...");

  try {
    await messageQueueService.connect();
    console.log("✅ Message queue connected");
  } catch (error) {
    console.warn(
      "⚠️ Message queue connection failed, continuing without queue"
    );
    console.log("   Reason: RabbitMQ not available or authentication failed");
  }

  if (messageQueueService.connected) {
    try {
      await messageQueueService.consumeQueue(
        "notifications.email",
        notificationHandler.processEvent.bind(notificationHandler)
      );
      await messageQueueService.consumeQueue(
        "notifications.push",
        notificationHandler.processEvent.bind(notificationHandler)
      );
      await messageQueueService.consumeQueue(
        "notifications.in_app",
        notificationHandler.processEvent.bind(notificationHandler)
      );
      await messageQueueService.consumeQueue(
        "notifications.sms",
        notificationHandler.processEvent.bind(notificationHandler)
      );
      await messageQueueService.consumeQueue(
        "notifications.webhook",
        notificationHandler.processEvent.bind(notificationHandler)
      );
      console.log("✅ Queue consumers started");
    } catch (error) {
      console.error("❌ Failed to start queue consumers:", error);
    }
  } else {
    console.log("📭 Skipping queue consumers - queue not connected");
  }

  console.log("✅ Notification Service initialized successfully");
}

async function start() {
  await initializeServices();

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;

  app.listen(port, () => {
    console.log(
      `🦊 Synkro Notification Service is running at localhost:${port}`
    );
    console.log(
      `📚 API Documentation available at http://localhost:${port}/swagger`
    );
  });
}

async function stop() {
  console.log("🛑 Shutting down Notification Service...");
  await messageQueueService.disconnect();
  await websocketHandler.shutdown();
  console.log("✅ Notification Service stopped");
}

start();

process.on("SIGTERM", async () => {
  await stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await stop();
  process.exit(0);
});
