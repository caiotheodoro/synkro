import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthResponse } from './dto/auth.response';
import { User, UserRole } from '../user/entities/user.entity';
import { TokenValidationResponse } from './dto/validate-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly invalidatedTokens: Set<string> = new Set();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    setInterval(() => this.cleanupInvalidatedTokens(), 3600000);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        this.logger.error('User not found');
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        this.logger.error('User is not active');
        throw new UnauthorizedException('User is not active');
      }

      const isPasswordValid = await user.validatePassword(password);

      if (!isPasswordValid) {
        this.logger.error('Invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.generateToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Login failed', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(
    createUserDto: CreateUserDto & { role?: UserRole },
  ): Promise<AuthResponse> {
    try {
      const user = await this.userService.create({
        ...createUserDto,
        role: createUserDto.role ?? UserRole.USER,
      });
      this.logger.log('User registered successfully');
      return this.generateToken(user);
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      if (!token || typeof token !== 'string') {
        this.logger.warn('Token is empty or not a string');
        return { isValid: false };
      }

      if (this.isTokenInvalidated(token)) {
        this.logger.warn(
          `Token has been invalidated: ${token.substring(0, 10)}...`,
        );
        return { isValid: false };
      }

      if (!this.isValidTokenFormat(token)) {
        this.logger.warn('Token has invalid format');
        return { isValid: false };
      }

      const payload = this.jwtService.verify(token);

      if (!payload?.sub) {
        this.logger.warn('Invalid token payload');
        return { isValid: false };
      }

      const user = await this.userService.findOne(payload.sub);

      if (!user?.isActive) {
        this.logger.warn(
          `User not found or inactive for token with sub: ${payload.sub}`,
        );
        return { isValid: false };
      }

      this.logger.log(`Token validated successfully for user: ${user.id}`);
      return {
        isValid: true,
        userId: user.id,
      };
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error.message}`);
      return { isValid: false };
    }
  }

  isTokenInvalidated(token: string): boolean {
    return this.invalidatedTokens.has(token);
  }

  private isValidTokenFormat(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      for (const part of parts) {
        if (!/^[A-Za-z0-9_-]+$/i.test(part)) {
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  invalidateToken(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        this.logger.warn('Cannot invalidate empty or non-string token');
        return false;
      }

      if (this.invalidatedTokens.has(token)) {
        this.logger.log(
          `Token already invalidated: ${token.substring(0, 10)}...`,
        );
        return true;
      }

      this.invalidatedTokens.add(token);

      this.logger.log(
        `Token invalidated. Invalidated tokens count: ${this.invalidatedTokens.size}`,
      );

      try {
        if (this.isValidTokenFormat(token)) {
          const payload = this.jwtService.verify(token);
          if (payload?.sub) {
            this.logger.log(`Token invalidated for user: ${payload.sub}`);
          }
        } else {
          this.logger.warn('Invalidated token with invalid format');
        }
      } catch (verifyError) {
        // If verification fails, we still keep the token in the invalidated set
        this.logger.warn(
          `Could not verify token during invalidation: ${verifyError.message}`,
        );
      }

      // Clean up expired tokens periodically
      this.cleanupInvalidatedTokens();

      return true;
    } catch (error) {
      this.logger.warn(`Failed to invalidate token: ${error.message}`);
      return false;
    }
  }

  private cleanupInvalidatedTokens(): void {
    const initialSize = this.invalidatedTokens.size;

    // Remove expired tokens from the invalidated tokens set
    for (const token of this.invalidatedTokens) {
      try {
        // Only verify if the token has a valid format
        if (this.isValidTokenFormat(token)) {
          this.jwtService.verify(token);
        } else {
          // Remove tokens with invalid format
          this.invalidatedTokens.delete(token);
        }
      } catch (error) {
        // Token is expired or invalid, remove it from the set
        this.invalidatedTokens.delete(token);
      }
    }

    const removedCount = initialSize - this.invalidatedTokens.size;
    if (removedCount > 0) {
      this.logger.log(
        `Cleaned up ${removedCount} expired tokens. Current count: ${this.invalidatedTokens.size}`,
      );
    }
  }

  private generateToken(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
