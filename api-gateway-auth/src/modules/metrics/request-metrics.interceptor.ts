import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class RequestMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          this.metricsService.incrementRequestCounter(url, method, 200);
        },
        error: (error) => {
          this.metricsService.incrementRequestCounter(
            url,
            method,
            error.status || 500,
          );
        },
      }),
    );
  }
}
