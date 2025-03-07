import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user.service';
import { User, UserRole } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UserService', () => {
  let service: UserService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test',
    role: UserRole.USER,
    isActive: true,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn().mockResolvedValue(undefined),
    validatePassword: jest.fn().mockResolvedValue(true),
  } as unknown as User;

  const mockRole = {
    id: '1',
    name: 'Test Role',
    permissions: ['read:users'],
    description: 'Test role description',
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Role;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: UserRole.USER,
    };

    it('should create a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createDto);
      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createDto,
        password: 'hashedPassword',
        isActive: true,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      mockUserRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        relations: ['roles'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '999' },
        relations: ['roles'],
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
        relations: ['roles'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      name: 'Updated Name',
      password: 'newpassword123',
    };

    it('should update a user', async () => {
      const updatedUser = {
        ...mockUser,
        ...updateDto,
        password: 'hashedPassword',
      };
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // For checking existence
        .mockResolvedValueOnce(null) // For checking email uniqueness
        .mockResolvedValueOnce(updatedUser); // For returning updated user
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);
      expect(result).toEqual(updatedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateDto,
        password: 'hashedPassword',
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new email already exists', async () => {
      const updateWithEmail = { ...updateDto, email: 'existing@example.com' };
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // For checking existence
        .mockResolvedValueOnce({ ...mockUser, id: '2' }); // For checking email uniqueness

      await expect(
        service.update(mockUser.id, updateWithEmail),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockUser.id);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      const updatedUser = { ...mockUser, roles: [mockRole] };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.assignRole(mockUser.id, mockRole.id);
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        roles: [mockRole],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.assignRole('999', mockRole.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when role not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRole(mockUser.id, '999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      const userWithRole = { ...mockUser, roles: [mockRole] };
      const updatedUser = { ...mockUser, roles: [] };
      mockUserRepository.findOne.mockResolvedValue(userWithRole);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.removeRole(mockUser.id, mockRole.id);
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...userWithRole,
        roles: [],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.removeRole('999', mockRole.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when role not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.removeRole(mockUser.id, '999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
