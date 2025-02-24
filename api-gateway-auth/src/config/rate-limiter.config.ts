import { RateLimiterModule } from 'nestjs-rate-limiter';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    RateLimiterModule.register({
      type: 'Memory',
      keyPrefix: 'global',
      points: 100,
      duration: 60,
      blockDuration: 60,
    }),
  ],
  exports: [RateLimiterModule],
})
export class RateLimiterConfigModule {}
