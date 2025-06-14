import { WebSocket } from "ws";

const API_BASE = "http://localhost:3005/api/v1";
const WS_URL = "ws://localhost:3006";

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

class NotificationTester {
  private results: TestResult[] = [];
  private ws: WebSocket | null = null;

  async runAllTests() {
    console.log("🧪 Starting Comprehensive Notification Service Tests\n");

    // Wait for service to be ready
    await this.waitForService();

    // Test 1: Service Health
    await this.testServiceHealth();

    // Test 2: Basic Notification Creation
    await this.testNotificationCreation();

    // Test 3: WebSocket Connection
    await this.testWebSocketConnection();

    // Test 4: Event Publishing (Email + In-App)
    await this.testEventPublishing();

    // Test 5: Service Stats
    await this.testServiceStats();

    // Test 6: Notification Retrieval
    await this.testNotificationRetrieval();

    // Cleanup
    await this.cleanup();

    // Print Results
    this.printResults();
  }

  private async waitForService(maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch("http://localhost:3005/health");
        if (response.ok) {
          console.log("✅ Service is ready\n");
          return;
        }
      } catch (error) {
        console.log(`⏳ Waiting for service... (${i + 1}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    throw new Error("Service did not start in time");
  }

  private async testServiceHealth() {
    try {
      const response = await fetch("http://localhost:3005/health");
      const data = await response.json();

      this.results.push({
        test: "Service Health Check",
        success: response.ok && data.status === "healthy",
        message: response.ok
          ? "Service is healthy"
          : "Service health check failed",
        data,
      });
    } catch (error) {
      this.results.push({
        test: "Service Health Check",
        success: false,
        message: `Health check failed: ${error}`,
      });
    }
  }

  private async testNotificationCreation() {
    try {
      const notification = {
        type: "INFO",
        channel: "email",
        tenantId: "test-tenant-123",
        recipientId: "user-456",
        subject: "Test Notification",
        message: "This is a test notification from the automated test suite",
        metadata: {
          email: "test@synkro.com",
          source: "automated-test",
        },
      };

      const response = await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });

      const data = await response.json();

      this.results.push({
        test: "Notification Creation",
        success: response.ok && data.id,
        message: response.ok
          ? `Notification created with ID: ${data.id}`
          : "Failed to create notification",
        data,
      });
    } catch (error) {
      this.results.push({
        test: "Notification Creation",
        success: false,
        message: `Notification creation failed: ${error}`,
      });
    }
  }

  private async testWebSocketConnection() {
    return new Promise<void>((resolve) => {
      try {
        const wsUrl = `${WS_URL}?userId=user-456&tenantId=test-tenant-123&token=test-token`;
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          this.results.push({
            test: "WebSocket Connection",
            success: false,
            message: "WebSocket connection timeout",
          });
          resolve();
        }, 5000);

        this.ws.on("open", () => {
          clearTimeout(timeout);
          this.results.push({
            test: "WebSocket Connection",
            success: true,
            message: "WebSocket connected successfully",
          });
        });

        this.ws.on("message", (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === "connected") {
              console.log(
                "📱 WebSocket welcome message received:",
                message.data.message
              );
            } else if (message.type === "notification") {
              console.log("🔔 Real-time notification received:", message.data);
            }
          } catch (error) {
            console.log("📨 WebSocket message:", data.toString());
          }
        });

        this.ws.on("error", (error) => {
          clearTimeout(timeout);
          this.results.push({
            test: "WebSocket Connection",
            success: false,
            message: `WebSocket error: ${error.message}`,
          });
          resolve();
        });

        // Give it a moment to connect
        setTimeout(resolve, 2000);
      } catch (error) {
        this.results.push({
          test: "WebSocket Connection",
          success: false,
          message: `WebSocket connection failed: ${error}`,
        });
        resolve();
      }
    });
  }

  private async testEventPublishing() {
    try {
      const event = {
        eventType: "inventory.low_stock",
        tenantId: "test-tenant-123",
        userId: "user-456",
        data: {
          itemName: "Premium Widget",
          sku: "PWD-001",
          currentStock: 5,
          threshold: 10,
          warehouseName: "Main Warehouse",
          contactEmail: "warehouse@synkro.com",
        },
        priority: "high",
      };

      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const data = await response.json();

      // Give time for processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.results.push({
        test: "Event Publishing",
        success: response.ok && data.success,
        message: response.ok
          ? `Event ${event.eventType} published successfully`
          : "Failed to publish event",
        data,
      });
    } catch (error) {
      this.results.push({
        test: "Event Publishing",
        success: false,
        message: `Event publishing failed: ${error}`,
      });
    }
  }

  private async testServiceStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();

      this.results.push({
        test: "Service Statistics",
        success: response.ok && typeof data.totalNotifications === "number",
        message: response.ok
          ? `Stats retrieved: ${data.totalNotifications} notifications, ${
              data.websocket?.totalClients || 0
            } WS clients`
          : "Failed to get service stats",
        data,
      });
    } catch (error) {
      this.results.push({
        test: "Service Statistics",
        success: false,
        message: `Stats retrieval failed: ${error}`,
      });
    }
  }

  private async testNotificationRetrieval() {
    try {
      const response = await fetch(
        `${API_BASE}/notifications/test-tenant-123?userId=user-456`
      );
      const data = await response.json();

      this.results.push({
        test: "Notification Retrieval",
        success: response.ok && Array.isArray(data),
        message: response.ok
          ? `Retrieved ${data.length} notifications for user`
          : "Failed to retrieve notifications",
        data: { count: Array.isArray(data) ? data.length : 0 },
      });
    } catch (error) {
      this.results.push({
        test: "Notification Retrieval",
        success: false,
        message: `Notification retrieval failed: ${error}`,
      });
    }
  }

  private async cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 NOTIFICATION SERVICE TEST RESULTS");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.success).length;
    const total = this.results.length;

    this.results.forEach((result, index) => {
      const status = result.success ? "✅" : "❌";
      console.log(`${index + 1}. ${status} ${result.test}`);
      console.log(`   ${result.message}`);
      if (result.data && typeof result.data === "object") {
        console.log(
          `   Data:`,
          JSON.stringify(result.data, null, 2).substring(0, 200)
        );
      }
      console.log();
    });

    console.log("=".repeat(60));
    console.log(`📊 SUMMARY: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log(
        "🎉 All tests passed! Notification service is working correctly."
      );
    } else {
      console.log("⚠️  Some tests failed. Please check the results above.");
    }
    console.log("=".repeat(60));
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const tester = new NotificationTester();
  await tester.runAllTests();
  process.exit(0);
}

export { NotificationTester };
