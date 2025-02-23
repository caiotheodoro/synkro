import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { User, UserRole } from '../entities/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
  } as User;

  const mockAdmin = {
    ...mockUser,
    id: '2',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            remove: jest.fn().mockResolvedValue(undefined),
            setActive: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users for admin', async () => {
      const result = await controller.findAll({ user: mockAdmin });
      expect(result).toEqual([mockUser]);
      expect(userService.findAll).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      await expect(controller.findAll({ user: mockUser })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user for admin', async () => {
      const result = await controller.findOne('1', { user: mockAdmin });
      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith('1');
    });

    it('should return own profile for user', async () => {
      const result = await controller.findOne('1', { user: mockUser });
      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenException when accessing other user profile', async () => {
      await expect(controller.findOne('2', { user: mockUser })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        controller.findOne('999', { user: mockAdmin }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user for admin', async () => {
      const result = await controller.update('1', updateDto, {
        user: mockAdmin,
      });
      expect(result).toEqual(mockUser);
      expect(userService.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should update own profile for user', async () => {
      const result = await controller.update('1', updateDto, {
        user: mockUser,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenException when updating other user profile', async () => {
      await expect(
        controller.update('2', updateDto, { user: mockUser }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove user for admin', async () => {
      await controller.remove('1', { user: mockAdmin });
      expect(userService.remove).toHaveBeenCalledWith('1');
    });

    it('should remove own profile for user', async () => {
      await controller.remove('1', { user: mockUser });
      expect(userService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw ForbiddenException when removing other user profile', async () => {
      await expect(controller.remove('2', { user: mockUser })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('setActive', () => {
    it('should set user active status for admin', async () => {
      const result = await controller.setActive('1', false, {
        user: mockAdmin,
      });
      expect(result).toEqual(mockUser);
      expect(userService.setActive).toHaveBeenCalledWith('1', false);
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      await expect(
        controller.setActive('1', false, { user: mockUser }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
