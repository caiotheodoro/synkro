import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './dto/auth.response';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.debug(`Attempting login for email: ${loginDto.email}`);

    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      this.logger.debug('User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug('User found, validating password');
    const isPasswordValid = await user.validatePassword(loginDto.password);
    this.logger.debug(`Password validation result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.debug('User is inactive');
      throw new UnauthorizedException('User account is inactive');
    }

    this.logger.debug('Login successful, generating token');
    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = new User({
      ...registerDto,
    });

    await user.hashPassword();
    const savedUser = await this.userRepository.save(user);

    return this.generateToken(savedUser);
  }

  private generateToken(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: new User(user),
    };
  }
}
