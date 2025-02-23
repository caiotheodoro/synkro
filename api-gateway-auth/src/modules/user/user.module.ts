import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { RolesGuard } from './guards/roles.guard';
import { UserController } from './controllers/user.controller';
import { RoleController } from './controllers/role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UserService, RoleService, RolesGuard],
  controllers: [UserController, RoleController],
  exports: [UserService, RoleService, RolesGuard],
})
export class UserModule {}
