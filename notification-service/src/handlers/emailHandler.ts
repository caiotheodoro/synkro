import sgMail from "@sendgrid/mail";
import { NotificationEvent, Notification } from "../types";
import { notificationService } from "../services/notificationService";
import { templateService } from "../services/templateService";

export class EmailHandler {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn(
        "SENDGRID_API_KEY not set - email notifications will be logged only"
      );
      console.log("To enable SendGrid email notifications:");
      console.log("1. Sign up at https://sendgrid.com/");
      console.log("2. Create an API key in Settings > API Keys");
      console.log("3. Set SENDGRID_API_KEY environment variable");
      return;
    }

    if (!apiKey.startsWith("SG.")) {
      console.warn(
        "Invalid SendGrid API key format (should start with 'SG.') - email notifications will be logged only"
      );
      return;
    }

    sgMail.setApiKey(apiKey);
    this.isInitialized = true;
    console.log("Email handler initialized with SendGrid");
  }

  async sendEmail(notification: Notification): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log(`Email notification logged: ${notification.subject}`);
        console.log(`To: ${notification.metadata?.email || "unknown"}`);
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

      const email = notification.metadata?.email;
      if (!email) {
        throw new Error("No email address provided in notification metadata");
      }

      const emailContent = await this.formatEmailContent(notification);

      const msg = {
        to: email,
        from: process.env.FROM_EMAIL || "notifications@synkro.com",
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      console.log(`Sending email to ${email}: ${notification.subject}`);
      const response = await sgMail.send(msg);

      await notificationService.updateNotificationStatus(
        notification.id,
        "sent",
        {
          sentAt: new Date(),
          externalId: response[0].headers["x-message-id"] as string,
          metadata: {
            ...notification.metadata,
            sendGridResponse: response[0].statusCode,
          },
        }
      );

      console.log(`Email sent successfully: ${notification.id}`);
    } catch (error) {
      console.error("Email sending failed:", error);

      await notificationService.updateNotificationStatus(
        notification.id,
        "failed",
        {
          errorMessage:
            error instanceof Error ? error.message : "Unknown email error",
          metadata: { ...notification.metadata, lastError: error },
        }
      );

      throw error;
    }
  }

  private async formatEmailContent(
    notification: Notification
  ): Promise<{ subject: string; html: string; text: string }> {
    const eventType = notification.metadata?.eventType || "notification";
    const data = notification.metadata?.originalData || {};

    // Try to use a template based on event type
    let templateId = this.getTemplateId(eventType);

    if (templateId) {
      try {
        const templateVariables = {
          ...data,
          userName: data.userName || "User",
          companyName: "Synkro",
          alertType: eventType.includes("low_stock")
            ? "Low Stock"
            : eventType.includes("out_of_stock")
            ? "Out of Stock"
            : "Alert",
          isUrgent:
            eventType.includes("out_of_stock") || notification.type === "ALERT",
          timestamp: new Date(),
          inventoryUrl: `${
            process.env.DASHBOARD_URL || "https://app.synkro.com"
          }/inventory`,
          dashboardUrl: process.env.DASHBOARD_URL || "https://app.synkro.com",
          supportEmail: process.env.SUPPORT_EMAIL || "support@synkro.com",
          unsubscribeUrl: `${
            process.env.DASHBOARD_URL || "https://app.synkro.com"
          }/notifications/preferences`,
        };

        return await templateService.renderTemplate(
          templateId,
          templateVariables
        );
      } catch (error) {
        console.warn(
          `Failed to render template ${templateId}, falling back to default:`,
          error
        );
      }
    }

    // Fallback to default template
    return {
      subject: notification.subject || "Synkro Notification",
      html: this.formatHtmlMessage(notification),
      text: this.formatTextMessage(notification),
    };
  }

  private getTemplateId(eventType: string): string | null {
    const templateMap: Record<string, string> = {
      "user.welcome": "email-welcome",
      "inventory.low_stock": "email-inventory-alert",
      "inventory.out_of_stock": "email-inventory-alert",
    };

    return templateMap[eventType] || null;
  }

  private formatHtmlMessage(notification: Notification): string {
    const eventType = notification.metadata?.eventType || "notification";
    const data = notification.metadata?.originalData || {};

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; }
          .content { padding: 24px; }
          .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; font-size: 14px; color: #6c757d; }
          .alert { padding: 12px; border-radius: 4px; margin: 16px 0; }
          .alert-info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #bee5eb; }
          .alert-warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffeaa7; }
          .alert-error { background: #f8d7da; color: #721c24; border-left: 4px solid #f5c6cb; }
          .alert-success { background: #d4edda; color: #155724; border-left: 4px solid #c3e6cb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Synkro Notification</h1>
          </div>
          <div class="content">
            ${this.getAlertDiv(notification)}
            <p>${notification.message}</p>
            ${this.getEventDetails(eventType, data)}
          </div>
          <div class="footer">
            <p>This notification was sent by Synkro Logistics Platform</p>
            <p><small>Event: ${eventType} | Time: ${new Date().toLocaleString()}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private formatTextMessage(notification: Notification): string {
    const eventType = notification.metadata?.eventType || "notification";
    return `
SYNKRO NOTIFICATION

${notification.subject}

${notification.message}

Event: ${eventType}
Time: ${new Date().toLocaleString()}

---
Synkro Logistics Platform
    `.trim();
  }

  private getAlertDiv(notification: Notification): string {
    const typeClass =
      {
        INFO: "alert-info",
        WARNING: "alert-warning",
        ERROR: "alert-error",
        SUCCESS: "alert-success",
        ALERT: "alert-error",
      }[notification.type] || "alert-info";

    return `<div class="alert ${typeClass}"><strong>${notification.type}:</strong> ${notification.subject}</div>`;
  }

  private getEventDetails(eventType: string, data: any): string {
    if (!data || Object.keys(data).length === 0) return "";

    const details = Object.entries(data)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join("");

    return `
      <div style="margin-top: 20px;">
        <h3>Event Details:</h3>
        <ul>${details}</ul>
      </div>
    `;
  }
}

export const emailHandler = new EmailHandler();
