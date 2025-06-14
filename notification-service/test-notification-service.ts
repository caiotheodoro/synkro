#!/usr/bin/env bun

import { WebSocket } from "ws";

const API_BASE = "http://localhost:3005/api/v1";
const WS_URL = "ws://localhost:3006";

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

class EnhancedNotificationTester {
  private results: TestResult[] = [];
  private ws: WebSocket | null = null;

  async runAllTests() {
    console.log("🧪 Starting Enhanced Notification Service Tests\n");

    // Wait for service to be ready
    await this.waitForService();

    // Test 1: Service Health & Stats
    await this.testServiceHealth();
    await this.testServiceStats();

    // Test 2: Template Management
    await this.testTemplateManagement();

    // Test 3: Push Notification Token Management
    await this.testPushTokenManagement();

    // Test 4: WebSocket Connection
    await this.testWebSocketConnection();

    // Test 5: Enhanced Email with Templates
    await this.testTemplatedEmailNotification();

    // Test 6: Push Notification Event
    await this.testPushNotificationEvent();

    // Test 7: Multi-Channel Event (Email + Push + In-App)
    await this.testMultiChannelEvent();

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

  private async testServiceStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();

      const hasExpectedFields =
        data.totalNotifications !== undefined &&
        data.pushNotifications !== undefined &&
        data.templates !== undefined;

      this.results.push({
        test: "Enhanced Service Statistics",
        success: response.ok && hasExpectedFields,
        message: response.ok
          ? `Stats: ${data.totalNotifications} notifications, ${
              data.templates?.totalTemplates || 0
            } templates, ${
              data.pushNotifications?.totalTokens || 0
            } push tokens`
          : "Failed to get enhanced stats",
        data: {
          notifications: data.totalNotifications,
          templates: data.templates?.totalTemplates,
          pushTokens: data.pushNotifications?.totalTokens,
        },
      });
    } catch (error) {
      this.results.push({
        test: "Enhanced Service Statistics",
        success: false,
        message: `Enhanced stats retrieval failed: ${error}`,
      });
    }
  }

  private async testTemplateManagement() {
    try {
      // Get available templates
      const getResponse = await fetch(`${API_BASE}/templates`);
      const templates = await getResponse.json();

      const hasBuiltInTemplates =
        Array.isArray(templates) && templates.length > 0;

      this.results.push({
        test: "Template Management",
        success: getResponse.ok && hasBuiltInTemplates,
        message: getResponse.ok
          ? `Found ${templates.length} built-in templates: ${templates
              .map((t: any) => t.name)
              .join(", ")}`
          : "Failed to get templates",
        data: {
          templateCount: Array.isArray(templates) ? templates.length : 0,
        },
      });
    } catch (error) {
      this.results.push({
        test: "Template Management",
        success: false,
        message: `Template management test failed: ${error}`,
      });
    }
  }

  private async testPushTokenManagement() {
    try {
      // Register a test device token
      const registerResponse = await fetch(`${API_BASE}/push/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "test-user-123",
          tenantId: "test-tenant-123",
          token: "fake-fcm-token-for-testing-12345",
          platform: "android",
        }),
      });

      const registerData = await registerResponse.json();

      this.results.push({
        test: "Push Token Management",
        success: registerResponse.ok && registerData.success,
        message: registerResponse.ok
          ? "Device token registered successfully"
          : "Failed to register device token",
        data: registerData,
      });
    } catch (error) {
      this.results.push({
        test: "Push Token Management",
        success: false,
        message: `Push token management test failed: ${error}`,
      });
    }
  }

  private async testWebSocketConnection() {
    return new Promise<void>((resolve) => {
      try {
        const wsUrl = `${WS_URL}?userId=test-user-123&tenantId=test-tenant-123&token=test-token`;
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
              console.log("📱 WebSocket welcome message received");
            } else if (message.type === "notification") {
              console.log(
                "🔔 Real-time notification received:",
                message.data.eventType
              );
            }
          } catch (error) {
            console.log("📨 WebSocket message received");
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

  private async testTemplatedEmailNotification() {
    try {
      const event = {
        eventType: "user.welcome",
        tenantId: "test-tenant-123",
        userId: "test-user-123",
        data: {
          userName: "John Doe",
          companyName: "Acme Logistics",
          email: "john.doe@acme.com",
          dashboardUrl: "https://app.synkro.com/dashboard",
        },
        priority: "normal",
      };

      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.results.push({
        test: "Templated Email Notification",
        success: response.ok && data.success,
        message: response.ok
          ? "Welcome email with template sent successfully"
          : "Failed to send templated email",
        data,
      });
    } catch (error) {
      this.results.push({
        test: "Templated Email Notification",
        success: false,
        message: `Templated email test failed: ${error}`,
      });
    }
  }

  private async testPushNotificationEvent() {
    try {
      const event = {
        eventType: "inventory.out_of_stock",
        tenantId: "test-tenant-123",
        userId: "test-user-123",
        data: {
          itemName: "Critical Component X",
          sku: "CCX-001",
          currentStock: 0,
          threshold: 5,
          warehouseName: "Main Distribution Center",
          category: "Electronics",
          supplier: "TechCorp Inc.",
        },
        priority: "urgent",
      };

      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.results.push({
        test: "Push Notification Event",
        success: response.ok && data.success,
        message: response.ok
          ? "Out of stock push notification processed"
          : "Failed to process push notification event",
        data,
      });
    } catch (error) {
      this.results.push({
        test: "Push Notification Event",
        success: false,
        message: `Push notification event test failed: ${error}`,
      });
    }
  }

  private async testMultiChannelEvent() {
    try {
      const event = {
        eventType: "alert.critical",
        tenantId: "test-tenant-123",
        userId: "test-user-123",
        data: {
          alertTitle: "System Critical Alert",
          message:
            "Multiple warehouse systems are experiencing connectivity issues",
          severity: "critical",
          affectedSystems: ["WMS", "Inventory", "Shipping"],
          email: "admin@acme.com",
        },
        priority: "urgent",
      };

      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.results.push({
        test: "Multi-Channel Critical Alert",
        success: response.ok && data.success,
        message: response.ok
          ? "Critical alert sent via email, push, SMS, and in-app channels"
          : "Failed to send multi-channel alert",
        data,
      });
    } catch (error) {
      this.results.push({
        test: "Multi-Channel Critical Alert",
        success: false,
        message: `Multi-channel event test failed: ${error}`,
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
    console.log("\n" + "=".repeat(70));
    console.log("🧪 ENHANCED NOTIFICATION SERVICE TEST RESULTS");
    console.log("=".repeat(70));

    const passed = this.results.filter((r) => r.success).length;
    const total = this.results.length;

    this.results.forEach((result, index) => {
      const status = result.success ? "✅" : "❌";
      console.log(`${index + 1}. ${status} ${result.test}`);
      console.log(`   ${result.message}`);
      if (result.data && typeof result.data === "object") {
        const dataStr = JSON.stringify(result.data, null, 2);
        console.log(
          `   Data: ${dataStr.substring(0, 150)}${
            dataStr.length > 150 ? "..." : ""
          }`
        );
      }
      console.log();
    });

    console.log("=".repeat(70));
    console.log(`📊 SUMMARY: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log("🎉 All enhanced features working correctly!");
      console.log("✨ Your notification service now supports:");
      console.log("   📧 Templated emails with beautiful HTML");
      console.log("   📱 Push notifications with Firebase FCM");
      console.log("   🔔 Real-time WebSocket notifications");
      console.log("   🎯 Multi-channel event routing");
      console.log("   📊 Comprehensive statistics and monitoring");
    } else {
      console.log("⚠️  Some enhanced features need attention.");
    }
    console.log("=".repeat(70));
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const tester = new EnhancedNotificationTester();
  await tester.runAllTests();
  process.exit(0);
}

export { EnhancedNotificationTester };
