import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RoutingService {
  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
    @Inject('AI_ML_SERVICE') private readonly aiMlClient: ClientProxy,
  ) {}

  async routeToNotificationService(pattern: string, data: any) {
    return lastValueFrom(this.notificationClient.send(pattern, data));
  }

  async routeToInventoryService(pattern: string, data: any) {
    return lastValueFrom(this.inventoryClient.send(pattern, data));
  }

  async routeToAiMlService(pattern: string, data: any) {
    return lastValueFrom(this.aiMlClient.send(pattern, data));
  }

  async broadcastEvent(pattern: string, data: any) {
    return Promise.all([
      lastValueFrom(this.notificationClient.emit(pattern, data)),
      lastValueFrom(this.inventoryClient.emit(pattern, data)),
      lastValueFrom(this.aiMlClient.emit(pattern, data)),
    ]);
  }
}
