import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthResponse } from './dto/auth.response';
import { User, UserRole } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = await this.userService.findByEmail(email);

      if (!user.isActive) {
        this.logger.error('User is not active');
        throw new UnauthorizedException('User is not active');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.logger.error('Invalid credentials');
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.generateToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(
    createUserDto: CreateUserDto & { role?: UserRole },
  ): Promise<AuthResponse> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userService.create({
        ...createUserDto,
        password: hashedPassword,
        role: createUserDto.role || UserRole.USER,
      });
      this.logger.log('User registered successfully');
      return this.generateToken(user);
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw error;
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
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
