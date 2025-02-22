import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { register, collectDefaultMetrics } from "prom-client";
import { notificationService } from "./services/notificationService";

collectDefaultMetrics();

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Notification Service API",
          version: "1.0.0",
        },
      },
    })
  )
  .get("/health", () => ({ status: "healthy" }))
  .get("/readiness", () => ({ status: "ready" }))
  .get("/metrics", async () => {
    return new Response(await register.metrics(), {
      headers: {
        "Content-Type": register.contentType,
      },
    });
  })
  .post("/api/v1/notifications", async ({ body }) => {
    return await notificationService.createNotification(body as any);
  })
  .get(
    "/api/v1/notifications/:tenantId",
    async ({ params: { tenantId }, query: { userId } }) => {
      return await notificationService.getNotifications(
        tenantId,
        userId as string | undefined
      );
    }
  )
  .delete(
    "/api/v1/notifications/:tenantId/:id",
    async ({ params: { tenantId, id } }) => {
      return await notificationService.deleteNotification(id, tenantId);
    }
  );

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen(port, () => {
  console.log(
    `🦊 Notification service is running at ${app.server?.hostname}:${port}`
  );
});
