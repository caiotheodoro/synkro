import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiOkResponse({
    description: 'List of users retrieved',
    type: [User],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Req() req: { user: User }): Promise<User[]> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can access all users');
    }
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiOkResponse({
    description: 'User found',
    type: User,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or own profile only',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: { user: User },
  ): Promise<User> {
    const user = await this.userService.findOne(id).catch(() => null);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or own profile only',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user: User },
  ): Promise<User> {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or own profile only',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id') id: string,
    @Req() req: { user: User },
  ): Promise<void> {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.userService.remove(id);
  }

  @Patch(':id/active')
  @ApiOperation({ summary: 'Set user active status (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiOkResponse({
    description: 'User status updated successfully',
    type: User,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Req() req: { user: User },
  ): Promise<User> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user status');
    }
    return this.userService.setActive(id, isActive);
  }
}
