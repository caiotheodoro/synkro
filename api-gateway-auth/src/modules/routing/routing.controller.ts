import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { RoutingService } from './routing.service';
import { RateLimit } from 'nestjs-rate-limiter';
import { JwtAuthGuard } from '../user/guards/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Gateway')
@ApiBearerAuth('JWT-auth')
@Controller('api')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('notifications')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Too many requests, please try again later',
  })
  @ApiOperation({
    summary: 'Route notification request to notification service',
  })
  async handleNotificationRequest(@Body() data: any) {
    return this.routingService.routeToNotificationService(
      'createNotification',
      data,
    );
  }

  @Post('inventory')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({
    points: 20,
    duration: 60,
    errorMessage: 'Too many inventory requests, please try again later',
  })
  @ApiOperation({ summary: 'Route inventory request to inventory service' })
  async handleInventoryRequest(@Body() data: any) {
    return this.routingService.routeToInventoryService('updateInventory', data);
  }

  @Post('predictions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({
    points: 5,
    duration: 60,
    errorMessage: 'Too many prediction requests, please try again later',
  })
  @ApiOperation({ summary: 'Route prediction request to AI/ML service' })
  async handlePredictionRequest(@Body() data: any) {
    return this.routingService.routeToAiMlService('getPrediction', data);
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({
    points: 5,
    duration: 60,
    errorMessage: 'Too many broadcast requests, please try again later',
  })
  @ApiOperation({ summary: 'Broadcast event to all services' })
  async handleBroadcastEvent(@Body() data: any) {
    return this.routingService.broadcastEvent('globalEvent', data);
  }
}
