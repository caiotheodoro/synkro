import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('memory')
  @ApiOperation({ summary: 'Get current memory metrics' })
  async getMemoryMetrics() {
    return this.metricsService.updateMemoryMetrics();
  }
}
