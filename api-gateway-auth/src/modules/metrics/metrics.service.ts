import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestsCounter: Counter<string>,
    @InjectMetric('memory_usage_bytes')
    private readonly memoryGauge: Gauge<string>,
  ) {}

  incrementRequestCounter(path: string, method: string, statusCode: number) {
    this.requestsCounter.inc({
      path,
      method,
      status_code: statusCode.toString(),
    });
  }

  updateMemoryMetrics() {
    const memoryUsage = process.memoryUsage();
    this.memoryGauge.set(memoryUsage.heapUsed);
    return {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      threshold: 1024, // 1GB threshold
    };
  }
}
