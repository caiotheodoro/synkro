import {
  makeCounterProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

export const metricProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code'],
  }),
  makeGaugeProvider({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
  }),
];
