import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { metricProviders } from './metrics.config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Metrics')
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/system/metrics',
    }),
  ],
  controllers: [MetricsController],
  providers: [MetricsService, ...metricProviders],
  exports: [MetricsService],
})
export class MetricsModule {}
