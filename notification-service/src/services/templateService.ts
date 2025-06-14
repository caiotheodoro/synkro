import Handlebars from "handlebars";
import { NotificationTemplate } from "../types";

interface TemplateCache {
  compiled: HandlebarsTemplateDelegate;
  lastUsed: Date;
}

export class TemplateService {
  private templateCache: Map<string, TemplateCache> = new Map();
  private builtInTemplates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeBuiltInTemplates();
    this.registerHelpers();
  }

  private initializeBuiltInTemplates() {
    // Email templates
    this.builtInTemplates.set("email-welcome", {
      id: "email-welcome",
      name: "Welcome Email",
      type: "email",
      subject: "Welcome to {{companyName}}!",
      templateContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to {{companyName}}!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 24px;">Hi {{userName}},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">
              We're excited to have you join our logistics platform. Your account has been successfully created and you're ready to start managing your supply chain operations.
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #333;">Getting Started:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Complete your company profile</li>
                <li>Set up your first warehouse</li>
                <li>Invite team members</li>
                <li>Configure notification preferences</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Access Dashboard</a>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              If you have any questions, our support team is here to help at <a href="mailto:{{supportEmail}}" style="color: #667eea;">{{supportEmail}}</a>
            </p>
          </div>
        </div>
      `,
      variables: ["userName", "companyName", "dashboardUrl", "supportEmail"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.builtInTemplates.set("email-inventory-alert", {
      id: "email-inventory-alert",
      name: "Inventory Alert Email",
      type: "email",
      subject: "{{alertType}} Alert: {{itemName}}",
      templateContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: {{#if isUrgent}}#dc3545{{else}}#ffc107{{/if}}; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">{{alertType}} Alert</h1>
          </div>
          <div style="padding: 24px;">
            <div style="background: {{#if isUrgent}}#f8d7da{{else}}#fff3cd{{/if}}; border-left: 4px solid {{#if isUrgent}}#dc3545{{else}}#ffc107{{/if}}; padding: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 8px 0; color: {{#if isUrgent}}#721c24{{else}}#856404{{/if}};">{{itemName}} ({{sku}})</h2>
              <p style="margin: 0; color: {{#if isUrgent}}#721c24{{else}}#856404{{/if}};">
                Current Stock: <strong>{{currentStock}} units</strong>
                {{#if threshold}}
                  <br>Threshold: {{threshold}} units
                {{/if}}
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #333;">Item Details:</h3>
              <table style="width: 100%; color: #666;">
                <tr><td style="padding: 4px 0;"><strong>SKU:</strong></td><td>{{sku}}</td></tr>
                <tr><td style="padding: 4px 0;"><strong>Warehouse:</strong></td><td>{{warehouseName}}</td></tr>
                <tr><td style="padding: 4px 0;"><strong>Category:</strong></td><td>{{category}}</td></tr>
                {{#if supplier}}
                <tr><td style="padding: 4px 0;"><strong>Supplier:</strong></td><td>{{supplier}}</td></tr>
                {{/if}}
              </table>
            </div>

            {{#if isUrgent}}
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 16px; border-radius: 6px; margin: 24px 0;">
              <p style="margin: 0; color: #721c24; font-weight: 500;">
                ⚠️ Immediate action required - This item is out of stock or critically low.
              </p>
            </div>
            {{/if}}

            <div style="text-align: center; margin: 32px 0;">
              <a href="{{inventoryUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 12px;">View Inventory</a>
              {{#if reorderUrl}}
              <a href="{{reorderUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reorder Now</a>
              {{/if}}
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Alert generated on {{formatDate timestamp}} | <a href="{{unsubscribeUrl}}" style="color: #667eea;">Manage Notifications</a></p>
          </div>
        </div>
      `,
      variables: [
        "alertType",
        "itemName",
        "sku",
        "currentStock",
        "threshold",
        "warehouseName",
        "category",
        "supplier",
        "isUrgent",
        "inventoryUrl",
        "reorderUrl",
        "timestamp",
        "unsubscribeUrl",
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.builtInTemplates.set("push-simple", {
      id: "push-simple",
      name: "Simple Push Notification",
      type: "push",
      subject: "{{title}}",
      templateContent: "{{message}}",
      variables: ["title", "message"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`Initialized ${this.builtInTemplates.size} built-in templates`);
  }

  private registerHelpers() {
    // Date formatting helper
    Handlebars.registerHelper("formatDate", (date: Date | string) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    // Conditional helper for comparisons
    Handlebars.registerHelper("eq", (a: any, b: any) => a === b);
    Handlebars.registerHelper("gt", (a: number, b: number) => a > b);
    Handlebars.registerHelper("lt", (a: number, b: number) => a < b);

    // String helpers
    Handlebars.registerHelper(
      "uppercase",
      (str: string) => str?.toUpperCase() || ""
    );
    Handlebars.registerHelper(
      "lowercase",
      (str: string) => str?.toLowerCase() || ""
    );
    Handlebars.registerHelper("truncate", (str: string, length: number) => {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + "...";
    });

    // Number formatting
    Handlebars.registerHelper(
      "currency",
      (amount: number, currency = "USD") => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
        }).format(amount);
      }
    );

    Handlebars.registerHelper("number", (num: number) => {
      return new Intl.NumberFormat("en-US").format(num);
    });

    console.log("Registered Handlebars helpers");
  }

  async renderTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<{
    subject: string;
    html: string;
    text: string;
  }> {
    const template = await this.getTemplate(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Get or compile template
    const compiled = this.getCompiledTemplate(templateId, template);

    // Render subject
    const subject = template.subject
      ? Handlebars.compile(template.subject)(variables)
      : "Notification";

    // Render HTML content
    const html = compiled(variables);

    // Generate text version
    const text = this.htmlToText(html);

    return { subject, html, text };
  }

  private getCompiledTemplate(
    templateId: string,
    template: NotificationTemplate
  ): HandlebarsTemplateDelegate {
    const cached = this.templateCache.get(templateId);

    if (cached) {
      cached.lastUsed = new Date();
      return cached.compiled;
    }

    // Compile and cache
    const compiled = Handlebars.compile(template.templateContent);
    this.templateCache.set(templateId, {
      compiled,
      lastUsed: new Date(),
    });

    return compiled;
  }

  private async getTemplate(
    templateId: string
  ): Promise<NotificationTemplate | null> {
    // Check built-in templates first
    const builtIn = this.builtInTemplates.get(templateId);
    if (builtIn) {
      return builtIn;
    }

    // In a real implementation, this would fetch from database
    // For now, return null for custom templates
    return null;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Template management methods
  async createTemplate(
    template: Omit<NotificationTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<NotificationTemplate> {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real implementation, save to database
    // For now, just add to built-in templates
    this.builtInTemplates.set(newTemplate.id, newTemplate);

    console.log(`Created template: ${newTemplate.name} (${newTemplate.id})`);
    return newTemplate;
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<NotificationTemplate>
  ): Promise<NotificationTemplate | null> {
    const existing = this.builtInTemplates.get(templateId);
    if (!existing) return null;

    const updated: NotificationTemplate = {
      ...existing,
      ...updates,
      id: templateId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.builtInTemplates.set(templateId, updated);

    // Clear cache for this template
    this.templateCache.delete(templateId);

    console.log(`Updated template: ${templateId}`);
    return updated;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const deleted = this.builtInTemplates.delete(templateId);
    if (deleted) {
      this.templateCache.delete(templateId);
      console.log(`Deleted template: ${templateId}`);
    }
    return deleted;
  }

  getAvailableTemplates(): NotificationTemplate[] {
    return Array.from(this.builtInTemplates.values());
  }

  // Cache management
  clearTemplateCache(): void {
    this.templateCache.clear();
    console.log("Template cache cleared");
  }

  getTemplateStats(): {
    totalTemplates: number;
    cachedTemplates: number;
    cacheHitRate: number;
  } {
    return {
      totalTemplates: this.builtInTemplates.size,
      cachedTemplates: this.templateCache.size,
      cacheHitRate:
        this.templateCache.size / Math.max(this.builtInTemplates.size, 1),
    };
  }

  // Cleanup old cache entries
  cleanupCache(maxAgeMinutes: number = 60): number {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let removedCount = 0;

    this.templateCache.forEach((cache, templateId) => {
      if (cache.lastUsed < cutoffTime) {
        this.templateCache.delete(templateId);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} cached templates`);
    }

    return removedCount;
  }
}

export const templateService = new TemplateService();
