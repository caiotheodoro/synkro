import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { configureSecurityMiddleware } from './config/security.config';
import { RequestMetricsInterceptor } from './modules/metrics/request-metrics.interceptor';
import { MetricsService } from './modules/metrics/metrics.service';
import { createLoggerConfig } from './config/logger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: WinstonModule.createLogger(createLoggerConfig()),
    },
  );

  const configService = app.get(ConfigService);
  const metricsService = app.get(MetricsService);

  app.setGlobalPrefix('api');

  await configureSecurityMiddleware(
    app.getHttpAdapter().getInstance(),
    configService,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new RequestMetricsInterceptor(metricsService));

  const config = new DocumentBuilder()
    .setTitle('API Gateway Auth')
    .setDescription('The API Gateway Authentication and Authorization API')
    .setVersion('1.0')
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Roles', 'Role management endpoints')
    .addTag('Gateway', 'API Gateway routing endpoints')
    .addTag('Monitoring', 'Health and monitoring endpoints')
    .addTag('Metrics', 'Prometheus metrics endpoints')
    .addTag('System', 'System health and information')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('swagger', app, document, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
    },
    customSiteTitle: 'API Gateway Auth Documentation',
  });

  app.enableCors();

  // Start the server
  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
