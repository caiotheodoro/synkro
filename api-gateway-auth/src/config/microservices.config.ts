import { registerAs } from '@nestjs/config';

export default registerAs('microservices', () => ({
  notification: {
    host: (process.env.NOTIFICATION_SERVICE_HOST as string) || 'localhost',
    port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3001', 10),
  },
  inventory: {
    host: (process.env.INVENTORY_SERVICE_HOST as string) || 'localhost',
    port: parseInt(process.env.INVENTORY_SERVICE_PORT || '3002', 10),
  },
  aiMl: {
    host: (process.env.AI_ML_SERVICE_HOST as string) || 'localhost',
    port: parseInt(process.env.AI_ML_SERVICE_PORT || '3003', 10),
  },
}));
