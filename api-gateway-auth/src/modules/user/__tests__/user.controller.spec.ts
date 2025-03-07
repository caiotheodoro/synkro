import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../user.service';
import { User, UserRole } from '../entities/user.entity';

describe('UserController', () => {
  let controller: UserController;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test',
    role: UserRole.ADMIN,
    isActive: true,
  } as User;

  const mockNonAdminUser = {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: UserRole.USER,
    isActive: true,
  } as User;

  const mockUserService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('findAll', () => {
    it('should return array of users for admin', async () => {
      mockUserService.findAll.mockResolvedValue([mockUser]);
      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user for admin', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);
      const result = await controller.findOne(mockUser.id, {
        user: mockUser,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenException when non-admin user tries to access another profile', async () => {
      await expect(
        controller.findOne(mockUser.id, {
          user: mockNonAdminUser,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        controller.findOne('999', {
          user: mockUser,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Name',
    };

    it('should update user profile for admin', async () => {
      mockUserService.update.mockResolvedValue({ ...mockUser, ...updateDto });
      const result = await controller.update(mockUser.id, updateDto, {
        user: mockUser,
      });
      expect(result).toEqual({ ...mockUser, ...updateDto });
    });
  });

  describe('remove', () => {
    it('should remove user for admin', async () => {
      mockUserService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(mockUser.id)).resolves.toBeUndefined();
    });
  });
});
