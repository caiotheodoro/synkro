import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { RoleService } from '../role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('access-token')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The role has been successfully created.',
    type: Role,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Role with this name already exists.',
  })
  create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all roles.',
    type: [Role],
  })
  findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the role.',
    type: Role,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found.',
  })
  findOne(@Param('id') id: string): Promise<Role> {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The role has been successfully updated.',
    type: Role,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found.',
  })
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The role has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.roleService.remove(id);
  }

  @Post(':id/permissions/:permission')
  @ApiOperation({ summary: 'Add a permission to a role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The permission has been successfully added to the role.',
    type: Role,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found.',
  })
  addPermission(
    @Param('id') id: string,
    @Param('permission') permission: string,
  ): Promise<Role> {
    return this.roleService.addPermission(id, permission);
  }

  @Delete(':id/permissions/:permission')
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The permission has been successfully removed from the role.',
    type: Role,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found.',
  })
  removePermission(
    @Param('id') id: string,
    @Param('permission') permission: string,
  ): Promise<Role> {
    return this.roleService.removePermission(id, permission);
  }
}
