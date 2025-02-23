import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }

    if (requiredRoles) {
      const hasRole = user.roles.some((role) =>
        requiredRoles.includes(role.name),
      );
      if (!hasRole) {
        return false;
      }
    }

    if (requiredPermissions) {
      const userPermissions = user.roles.reduce(
        (acc, role) => [...acc, ...(role.permissions || [])],
        [] as string[],
      );
      return requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
    }

    return true;
  }
}
