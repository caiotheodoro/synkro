import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { MetricsService } from '../metrics/metrics.service';
import { RoutingService } from '../routing/routing.service';

@Injectable()
export class MonitoringService extends HealthIndicator {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly routingService: RoutingService,
  ) {
    super();
  }

  async checkMicroservices(): Promise<HealthIndicatorResult> {
    try {
      // Check if microservices are responding by pinging their health endpoints
      const services = ['notification', 'inventory', 'aiMl'];
      const results = await Promise.allSettled(
        services.map(async (service) => {
          try {
            await this.routingService[
              `routeTo${service.charAt(0).toUpperCase() + service.slice(1)}Service`
            ]('health', {});
            return true;
          } catch {
            return false;
          }
        }),
      );

      const servicesStatus = services.reduce(
        (acc, service, index) => ({
          ...acc,
          [service]:
            results[index].status === 'fulfilled' && results[index].value
              ? 'up'
              : 'down',
        }),
        {},
      );

      const isHealthy = Object.values(servicesStatus).every(
        (status) => status === 'up',
      );

      return this.getStatus('microservices', isHealthy, {
        services: servicesStatus,
      });
    } catch (error) {
      return this.getStatus('microservices', false, {
        message: 'Failed to check microservices health',
      });
    }
  }

  async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      // For now, we'll consider the database healthy if we can make requests
      // In a real application, you would check the actual database connection
      return this.getStatus('database', true, {
        responseTime: 0,
        connections: 1,
      });
    } catch (error) {
      return this.getStatus('database', false, {
        message: 'Failed to check database health',
      });
    }
  }

  async checkMemoryUsage(): Promise<HealthIndicatorResult> {
    try {
      const metrics = this.metricsService.updateMemoryMetrics();
      const isHealthy = metrics.heapUsed < metrics.threshold;

      return this.getStatus('memory', isHealthy, {
        heapUsedMB: metrics.heapUsed,
        thresholdMB: metrics.threshold,
        percentage: Math.round((metrics.heapUsed / metrics.threshold) * 100),
      });
    } catch (error) {
      return this.getStatus('memory', false, {
        message: 'Failed to check memory health',
      });
    }
  }
}
