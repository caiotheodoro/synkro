import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../entities/user.entity';

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
            get: jest.fn().mockImplementation((key, context) => {
              if (key === 'roles') {
                return context.roles;
              }
              if (key === 'permissions') {
                return context.permissions;
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
    it('should return true when no roles are required', () => {
      mockExecutionContext.getHandler.mockReturnValue({});
      const request = { user: { roles: [{ name: UserRole.USER }] } };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should return true when user has required role', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: [UserRole.ADMIN],
      });
      const request = { user: { roles: [{ name: UserRole.ADMIN }] } };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: [UserRole.ADMIN],
      });
      const request = { user: { roles: [{ name: UserRole.USER }] } };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(false);
    });

    it('should return false when user has no role', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: [UserRole.USER],
      });
      const request = { user: { roles: [] } };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(false);
    });

    it('should return false when no user in request', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: [UserRole.USER],
      });
      const request = {};
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(false);
    });

    it('should handle multiple required roles', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        roles: [UserRole.ADMIN, UserRole.USER],
      });
      const request = { user: { roles: [{ name: UserRole.ADMIN }] } };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });
  });

  describe('checkPermissions', () => {
    it('should return true when no permissions are required', () => {
      mockExecutionContext.getHandler.mockReturnValue({});
      const request = {
        user: { roles: [{ permissions: ['read:users'] }] },
      };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should return true when user has required permission', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        permissions: ['read:users'],
      });
      const request = {
        user: { roles: [{ permissions: ['read:users'] }] },
      };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should return false when user does not have required permission', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        permissions: ['write:users'],
      });
      const request = {
        user: { roles: [{ permissions: ['read:users'] }] },
      };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(false);
    });

    it('should return false when user has no roles', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        permissions: ['read:users'],
      });
      const request = { user: { roles: [] } };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(false);
    });

    it('should return false when role has no permissions', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        permissions: ['read:users'],
      });
      const request = { user: { roles: [{ permissions: [] }] } };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(false);
    });

    it('should handle multiple required permissions', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        permissions: ['read:users', 'write:users'],
      });
      const request = {
        user: { roles: [{ permissions: ['read:users', 'write:users'] }] },
      };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should handle permissions across multiple roles', () => {
      mockExecutionContext.getHandler.mockReturnValue({
        permissions: ['read:users', 'write:users'],
      });
      const request = {
        user: {
          roles: [
            { permissions: ['read:users'] },
            { permissions: ['write:users'] },
          ],
        },
      };
      mockRequest.mockReturnValue(request);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });
  });
});
