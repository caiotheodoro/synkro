import { connect, Channel, ChannelModel } from "amqplib";
import { NotificationEvent } from "../types";

export class MessageQueueService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL ?? "amqp://localhost:5672";
      console.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);

      this.connection = await connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      await this.declareExchanges();
      await this.declareQueues();
      await this.bindQueues();

      this.isConnected = true;
      console.log("Successfully connected to RabbitMQ");

      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
        this.isConnected = false;
      });
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      this.isConnected = false;
      throw error;
    }
  }

  private async declareExchanges(): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    await this.channel.assertExchange("notifications", "topic", {
      durable: true,
    });
    await this.channel.assertExchange("notifications.dlx", "direct", {
      durable: true,
    });
  }

  private async declareQueues(): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    const queueOptions = {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "notifications.dlx",
        "x-dead-letter-routing-key": "failed",
      },
    };

    await this.channel.assertQueue("notifications.email", queueOptions);
    await this.channel.assertQueue("notifications.push", queueOptions);
    await this.channel.assertQueue("notifications.in_app", queueOptions);
    await this.channel.assertQueue("notifications.sms", queueOptions);
    await this.channel.assertQueue("notifications.webhook", queueOptions);
    await this.channel.assertQueue("notifications.failed", { durable: true });
  }

  private async bindQueues(): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    await this.channel.bindQueue(
      "notifications.email",
      "notifications",
      "email.*"
    );
    await this.channel.bindQueue(
      "notifications.push",
      "notifications",
      "push.*"
    );
    await this.channel.bindQueue(
      "notifications.in_app",
      "notifications",
      "in_app.*"
    );
    await this.channel.bindQueue("notifications.sms", "notifications", "sms.*");
    await this.channel.bindQueue(
      "notifications.webhook",
      "notifications",
      "webhook.*"
    );
    await this.channel.bindQueue(
      "notifications.failed",
      "notifications.dlx",
      "failed"
    );
  }

  async publishEvent(
    routingKey: string,
    event: NotificationEvent
  ): Promise<void> {
    if (!this.channel || !this.isConnected) {
      console.log("Queue not connected, skipping event publishing");
      return;
    }

    const message = Buffer.from(JSON.stringify(event));
    const published = this.channel.publish(
      "notifications",
      routingKey,
      message,
      {
        persistent: true,
        timestamp: Date.now(),
        messageId: crypto.randomUUID(),
        priority: this.getPriority(event.priority),
      }
    );

    if (!published) {
      console.warn("Failed to publish message to queue - channel may be full");
    } else {
      console.log(`Published event ${event.eventType} to ${routingKey}`);
    }
  }

  async consumeQueue(
    queueName: string,
    handler: (event: NotificationEvent) => Promise<void>
  ): Promise<void> {
    if (!this.channel || !this.isConnected) {
      console.warn(
        "Channel not initialized or connection lost - skipping queue consumption"
      );
      return;
    }

    await this.channel.prefetch(10);

    await this.channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;

        try {
          const event = JSON.parse(msg.content.toString()) as NotificationEvent;
          console.log(`Processing event ${event.eventType} from ${queueName}`);

          await handler(event);
          this.channel!.ack(msg);
        } catch (error) {
          console.error(`Error processing message from ${queueName}:`, error);
          this.channel!.nack(msg, false, false);
        }
      },
      {
        noAck: false,
      }
    );

    console.log(`Started consuming queue: ${queueName}`);
  }

  private getPriority(priority?: string): number {
    switch (priority) {
      case "urgent":
        return 10;
      case "high":
        return 7;
      case "normal":
        return 5;
      case "low":
        return 1;
      default:
        return 5;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnected = false;
      console.log("Disconnected from RabbitMQ");
    } catch (error) {
      console.error("Error disconnecting from RabbitMQ:", error);
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const messageQueueService = new MessageQueueService();
