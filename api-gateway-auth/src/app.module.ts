import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoutingModule } from './modules/routing/routing.module';
import { RateLimiterConfigModule } from './config/rate-limiter.config';
import { LoggingModule } from './modules/logging/logging.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './user/user.module';
import databaseConfig from './config/database.config';
import { getTypeOrmConfig } from './config/typeorm.config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './user/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    AuthModule,
    UserModule,
    RoutingModule,
    RateLimiterConfigModule,
    LoggingModule,
    MonitoringModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
