import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { MonitoringService } from './monitoring.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Monitoring')
@Controller('system/monitoring')
export class MonitoringController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Check health status of all services' })
  async check() {
    return this.health.check([
      () => this.monitoringService.checkMicroservices(),
      () => this.monitoringService.checkDatabase(),
      () => this.monitoringService.checkMemoryUsage(),
    ]);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get monitoring dashboard status' })
  async getMonitoringStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
