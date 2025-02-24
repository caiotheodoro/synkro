import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('NOTIFICATION_SERVICE_HOST'),
            port: configService.get('NOTIFICATION_SERVICE_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'INVENTORY_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('INVENTORY_SERVICE_HOST'),
            port: configService.get('INVENTORY_SERVICE_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'AI_ML_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AI_ML_SERVICE_HOST'),
            port: configService.get('AI_ML_SERVICE_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [RoutingController],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
