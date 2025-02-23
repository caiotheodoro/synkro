import { SetMetadata } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { UserRole } from '../entities/user.entity';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

jest.mock('@nestjs/swagger', () => ({
  ApiProperty: jest.fn(),
  ApiPropertyOptional: jest.fn(),
}));

jest.mock('typeorm', () => ({
  Entity: jest.fn(),
  Column: jest.fn(),
  PrimaryGeneratedColumn: jest.fn(),
  CreateDateColumn: jest.fn(),
  UpdateDateColumn: jest.fn(),
  BeforeInsert: jest.fn(),
  ManyToMany: jest.fn(),
  JoinTable: jest.fn(),
}));

jest.mock('class-transformer', () => ({
  Exclude: jest.fn(),
}));

describe('Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Roles Decorator', () => {
    it('should set metadata with roles key and provided roles', () => {
      const roles = [UserRole.ADMIN, UserRole.USER];
      Roles(...roles);

      expect(SetMetadata).toHaveBeenCalledWith('roles', roles);
    });

    it('should handle single role', () => {
      const role = UserRole.ADMIN;
      Roles(role);

      expect(SetMetadata).toHaveBeenCalledWith('roles', [role]);
    });
  });

  describe('Permissions Decorator', () => {
    it('should set metadata with permissions key and provided permissions', () => {
      const permissions = ['read:users', 'write:users'];
      Permissions(...permissions);

      expect(SetMetadata).toHaveBeenCalledWith('permissions', permissions);
    });

    it('should handle single permission', () => {
      const permission = 'read:users';
      Permissions(permission);

      expect(SetMetadata).toHaveBeenCalledWith('permissions', [permission]);
    });
  });
});
