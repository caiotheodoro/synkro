import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockRequest = jest.fn();
  const mockHttpContext = {
    getRequest: () => mockRequest(),
  };
  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => mockHttpContext,
  } as unknown as ExecutionContext & {
    getHandler: jest.Mock;
    getClass: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest
              .fn()
              .mockImplementation((key, [handler, class_]) => {
                if (key === 'roles') {
                  return handler.roles;
                }
                return undefined;
              }),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', async () => {
      mockExecutionContext.getHandler.mockReturnValue({});
      const request = { user: { role: UserRole.USER } };
      mockRequest.mockReturnValue(request);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should return true when user has required role', async () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: UserRole.ADMIN,
      });
      const request = { user: { role: UserRole.ADMIN } };
      mockRequest.mockReturnValue(request);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', async () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: UserRole.ADMIN,
      });
      const request = { user: { role: UserRole.USER } };
      mockRequest.mockReturnValue(request);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user has no role', async () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: UserRole.USER,
      });
      const request = { user: {} };
      mockRequest.mockReturnValue(request);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException when no user in request', async () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: UserRole.USER,
      });
      const request = {};
      mockRequest.mockReturnValue(request);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle admin role having access to everything', async () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: UserRole.USER,
      });
      const request = { user: { role: UserRole.ADMIN } };
      mockRequest.mockReturnValue(request);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });
});
