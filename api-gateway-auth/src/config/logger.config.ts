import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const createLoggerConfig = (): WinstonModuleOptions => {
  return {
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf((info) => {
            const { timestamp, level, message, context, ms, ...meta } = info;
            return `[${timestamp}] [${level}] ${context ? `[${context}]` : ''} ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            } ${ms}`;
          }),
        ),
      }),
    ],
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  };
};
