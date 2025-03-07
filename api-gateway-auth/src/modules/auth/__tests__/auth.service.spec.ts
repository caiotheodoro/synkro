import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../../user/entities/user.entity';
import { UserService } from '../../user/user.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser = new User();
  Object.assign(mockUser, {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
    roles: [],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset bcrypt mock
    (bcrypt.compare as jest.Mock).mockReset();
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const activeUser = new User();
      Object.assign(activeUser, {
        ...mockUser,
        isActive: true,
      });
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto.email, loginDto.password);

      expect(result).toEqual({
        access_token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: UserRole.USER,
          isActive: true,
        },
      });
      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest
        .spyOn(userService, 'findByEmail')
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const inactiveUser = new User();
      Object.assign(inactiveUser, {
        ...mockUser,
        isActive: false,
      });
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(inactiveUser);

      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        roleIds: [],
      };

      jest.spyOn(userService, 'create').mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: UserRole.USER,
          isActive: true,
        },
      });
      expect(userService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword',
        role: UserRole.USER,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'New User',
        roleIds: [],
      };

      jest
        .spyOn(userService, 'create')
        .mockRejectedValue(new ConflictException());

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
