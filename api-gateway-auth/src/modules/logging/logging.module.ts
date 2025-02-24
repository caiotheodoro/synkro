import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transports: [
          // Console Transport
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
          // File Transport
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
          // ELK Stack Transport
          ...(config.get('ELK_HOST')
            ? [
                new winston.transports.Http({
                  host: config.get('ELK_HOST'),
                  port: config.get('ELK_PORT'),
                  path: '/logs',
                  ssl: config.get('NODE_ENV') === 'production',
                }),
              ]
            : []),
        ],
      }),
    }),
  ],
})
export class LoggingModule {}
