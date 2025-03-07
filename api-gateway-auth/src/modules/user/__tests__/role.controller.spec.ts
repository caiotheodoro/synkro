import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleController } from '../controllers/role.controller';
import { RoleService } from '../role.service';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  const mockRole = {
    id: '1',
    name: 'Test Role',
    permissions: ['read:users'],
    description: 'Test role description',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Role;

  const mockRoleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addPermission: jest.fn(),
    removePermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    service = module.get<RoleService>(RoleService);
  });

  describe('create', () => {
    const createDto: CreateRoleDto = {
      name: 'New Role',
      permissions: ['read:users'],
      description: 'New role description',
    };

    it('should create a new role', async () => {
      const newRole = { ...mockRole, ...createDto };
      mockRoleService.create.mockResolvedValue(newRole);
      const result = await controller.create(createDto);
      expect(result).toEqual(newRole);
    });
  });

  describe('findAll', () => {
    it('should return array of roles', async () => {
      mockRoleService.findAll.mockResolvedValue([mockRole]);
      const result = await controller.findAll();
      expect(result).toEqual([mockRole]);
    });
  });

  describe('findOne', () => {
    it('should return a role', async () => {
      mockRoleService.findOne.mockResolvedValue(mockRole);
      const result = await controller.findOne(mockRole.id);
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRoleService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
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
      mockRoleService.update.mockResolvedValue(updatedRole);
      const result = await controller.update(mockRole.id, updateDto);
      expect(result).toEqual(updatedRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRoleService.update.mockRejectedValue(new NotFoundException());
      await expect(controller.update('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a role', async () => {
      mockRoleService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(mockRole.id)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRoleService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addPermission', () => {
    const permission = 'write:users';

    it('should add permission to role', async () => {
      const updatedRole = {
        ...mockRole,
        permissions: [...new Set([...mockRole.permissions, permission])],
      };
      mockRoleService.addPermission.mockResolvedValue(updatedRole);
      const result = await controller.addPermission(mockRole.id, permission);
      expect(result).toEqual(updatedRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRoleService.addPermission.mockRejectedValue(new NotFoundException());
      await expect(controller.addPermission('999', permission)).rejects.toThrow(
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
      mockRoleService.removePermission.mockResolvedValue(updatedRole);
      const result = await controller.removePermission(mockRole.id, permission);
      expect(result).toEqual(updatedRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRoleService.removePermission.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(
        controller.removePermission('999', permission),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
