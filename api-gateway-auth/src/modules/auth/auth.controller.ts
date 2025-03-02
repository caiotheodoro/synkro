import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpStatus,
  HttpCode,
  Headers,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../user/guards/auth.guard';
import { User } from '../../user/entities/user.entity';
import { AuthResponse, AuthUserResponse } from './dto/auth.response';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import {
  ValidateTokenDto,
  TokenValidationResponse,
} from './dto/validate-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully logged in.',
    type: AuthResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been successfully registered.',
    type: AuthResponse,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists.',
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
    this.logger.log(`Registration attempt for email: ${createUserDto.email}`);
    return this.authService.register(createUserDto);
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a JWT token' })
  @ApiBody({ type: ValidateTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token validation result',
    type: TokenValidationResponse,
  })
  async validateToken(
    @Body() validateTokenDto: ValidateTokenDto,
    @Headers('cache-control') cacheControl?: string,
  ): Promise<TokenValidationResponse> {
    if (!validateTokenDto || !validateTokenDto.token) {
      this.logger.warn('Token validation attempt with no token provided');
      return { isValid: false };
    }

    // Check if token is already known to be invalidated (fast path)
    if (this.authService.isTokenInvalidated(validateTokenDto.token)) {
      this.logger.log('Token is already known to be invalidated');
      return { isValid: false };
    }

    this.logger.log(
      `Token validation attempt: ${validateTokenDto.token.substring(0, 10)}...`,
    );
    const result = await this.authService.validateToken(validateTokenDto.token);
    this.logger.log(`Token validation result: ${JSON.stringify(result)}`);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and invalidate token' })
  @ApiBody({ type: ValidateTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully logged out and token invalidated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token format or missing token.',
  })
  async logout(
    @Body() logoutDto: ValidateTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!logoutDto || !logoutDto.token) {
        this.logger.warn('Logout attempt with no token provided');
        return {
          success: true,
          message: 'No token provided, nothing to invalidate',
        };
      }

      this.logger.log(
        `Logout attempt with token: ${logoutDto.token.substring(0, 10)}...`,
      );

      // Always invalidate the token, even if it's expired or invalid
      const invalidated = this.authService.invalidateToken(logoutDto.token);

      const message = invalidated
        ? 'Token successfully invalidated'
        : 'Failed to invalidate token';

      this.logger.log(`Logout result: ${message}`);

      return {
        success: invalidated,
        message,
      };
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`);
      throw new BadRequestException('Error processing logout request');
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the current user profile.',
    type: AuthUserResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  getProfile(@Req() req: { user: User }): AuthUserResponse {
    const { id, email, firstName, lastName, role, isActive } = req.user;
    this.logger.log(`Profile request for user: ${id}`);
    return { id, email, firstName, lastName, role, isActive };
  }
}
