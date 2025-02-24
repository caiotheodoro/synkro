import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MetricsModule } from '../metrics/metrics.module';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [TerminusModule, MetricsModule, RoutingModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
