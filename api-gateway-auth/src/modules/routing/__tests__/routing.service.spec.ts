import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { RoutingService } from '../routing.service';
describe('RoutingService', () => {
  let service: RoutingService;
  let notificationClient: jest.Mocked<ClientProxy>;
  let inventoryClient: jest.Mocked<ClientProxy>;
  let aiMlClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const mockClientProxy = {
      send: jest.fn().mockReturnValue(of({ success: true })),
      emit: jest.fn().mockReturnValue(of({ success: true })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        {
          provide: 'NOTIFICATION_SERVICE',
          useValue: { ...mockClientProxy },
        },
        {
          provide: 'INVENTORY_SERVICE',
          useValue: { ...mockClientProxy },
        },
        {
          provide: 'AI_ML_SERVICE',
          useValue: { ...mockClientProxy },
        },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
    notificationClient = module.get('NOTIFICATION_SERVICE');
    inventoryClient = module.get('INVENTORY_SERVICE');
    aiMlClient = module.get('AI_ML_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('routeToNotificationService', () => {
    it('should route message to notification service', async () => {
      const pattern = 'createNotification';
      const data = { message: 'test' };

      const result = await service.routeToNotificationService(pattern, data);

      expect(notificationClient.send).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual({ success: true });
    });
  });

  describe('routeToInventoryService', () => {
    it('should route message to inventory service', async () => {
      const pattern = 'updateInventory';
      const data = { item: 'test' };

      const result = await service.routeToInventoryService(pattern, data);

      expect(inventoryClient.send).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual({ success: true });
    });
  });

  describe('routeToAiMlService', () => {
    it('should route message to AI/ML service', async () => {
      const pattern = 'getPrediction';
      const data = { model: 'test' };

      const result = await service.routeToAiMlService(pattern, data);

      expect(aiMlClient.send).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual({ success: true });
    });
  });

  describe('broadcastEvent', () => {
    it('should broadcast event to all services', async () => {
      const pattern = 'globalEvent';
      const data = { event: 'test' };

      const result = await service.broadcastEvent(pattern, data);

      expect(notificationClient.emit).toHaveBeenCalledWith(pattern, data);
      expect(inventoryClient.emit).toHaveBeenCalledWith(pattern, data);
      expect(aiMlClient.emit).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual([
        { success: true },
        { success: true },
        { success: true },
      ]);
    });
  });
});
