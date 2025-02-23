import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleService } from '../role.service';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UserService } from '../user.service';

describe('RoleService', () => {
  let service: RoleService;

  const mockRole = {
    id: '1',
    name: 'Test Role',
    permissions: ['read:users'],
    description: 'Test role description',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Role;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  describe('create', () => {
    const createDto: CreateRoleDto = {
      name: 'New Role',
      permissions: ['read:users'],
      description: 'New role description',
    };

    it('should create a new role', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockRole);
      mockRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createDto);
      expect(result).toEqual(mockRole);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockRole);
    });

    it('should throw ConflictException if role name already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
    });
  });

  describe('findAll', () => {
    it('should return array of roles', async () => {
      mockRepository.find.mockResolvedValue([mockRole]);

      const result = await service.findAll();
      expect(result).toEqual([mockRole]);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a role', async () => {
      mockRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne(mockRole.id);
      expect(result).toEqual(mockRole);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRole.id },
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '999' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateRoleDto = {
      name: 'Updated Role',
      permissions: ['read:users', 'write:users'],
      description: 'Updated role description',
    };

    it('should update a role', async () => {
      const updatedRole = { ...mockRole, ...updateDto };
      mockRepository.findOne
        .mockResolvedValueOnce(mockRole) // For checking existence
        .mockResolvedValueOnce(null); // For checking name uniqueness
      mockRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(mockRole.id, updateDto);
      expect(result).toEqual(updatedRole);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockRole,
        ...updateDto,
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name already exists', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(mockRole) // For checking existence
        .mockResolvedValueOnce({ ...mockRole, id: '2' }); // For checking name uniqueness

      await expect(service.update(mockRole.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a role', async () => {
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockRole.id);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockRole.id);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addPermission', () => {
    const permission = 'write:users';

    it('should add permission to role', async () => {
      const updatedRole = {
        ...mockRole,
        description: 'Updated role description',
        name: 'Updated Role',
        permissions: [...mockRole.permissions, permission],
      };
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.save.mockResolvedValue(updatedRole);

      const result = await service.addPermission(mockRole.id, permission);
      expect(result).toEqual(updatedRole);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockRole,
        permissions: [...new Set([...mockRole.permissions, permission])],
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.addPermission('999', permission)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removePermission', () => {
    const permission = 'read:users';

    it('should remove permission from role', async () => {
      const updatedRole = {
        ...mockRole,
        permissions: mockRole.permissions.filter((p) => p !== permission),
      };
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.save.mockResolvedValue(updatedRole);

      const result = await service.removePermission(mockRole.id, permission);
      expect(result).toEqual(updatedRole);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.removePermission('999', permission)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle removing non-existent permission', async () => {
      const nonExistentPermission = 'non:existent';
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.save.mockResolvedValue(mockRole);

      const result = await service.removePermission(
        mockRole.id,
        nonExistentPermission,
      );
      expect(result.permissions).toEqual(mockRole.permissions);
    });
  });
});
