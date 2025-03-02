import * as request from 'supertest';
import { UserRole } from '../src/user/entities/user.entity';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserService } from '../src/user/user.service';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import {
  createTestApp,
  cleanupDatabase,
  createTestUser,
} from './utils/test-utils';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

jest.setTimeout(30000);

describe('User and Role Management (e2e)', () => {
  let app: NestFastifyApplication;
  let authService: AuthService;
  let userService: UserService;
  let adminToken: string;
  let userId: string;
  let roleId: string;

  beforeEach(async () => {
    app = await createTestApp();
    authService = app.get(AuthService);
    userService = app.get(UserService);

    const adminUser = await userService.create({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin',
      role: UserRole.ADMIN,
    } as CreateUserDto & { role: UserRole });

    const { access_token } = await authService.login(
      adminUser.email,
      'admin123',
    );
    adminToken = access_token;
    userId = adminUser.id;
  });

  afterEach(async () => {
    await cleanupDatabase(app);
  });

  describe('Roles', () => {
    it('should create a new role', async () => {
      const roleData = {
        name: 'test-role',
        permissions: ['read:users'],
        description: 'Test role',
      };

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(201);

      roleId = response.body.id;
      expect(response.body.name).toBe(roleData.name);
      expect(response.body.permissions).toEqual(roleData.permissions);
    });

    it('should add permission to role', async () => {
      return request(app.getHttpServer())
        .post(`/roles/${roleId}/permissions/delete:users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.permissions).toContain('delete:users');
        });
    });

    it('should remove permission from role', async () => {
      return request(app.getHttpServer())
        .delete(`/roles/${roleId}/permissions/delete:users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.permissions).not.toContain('delete:users');
        });
    });

    it('should fail to create role without admin token', async () => {
      const { accessToken: userToken } = await createTestUser(app);

      return request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'unauthorized-role',
          permissions: [],
          description: 'Test role',
        })
        .expect(403);
    });
  });

  describe('Users', () => {
    it('should assign role to user', async () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.roles).toContainEqual(
            expect.objectContaining({ id: roleId }),
          );
        });
    });

    it('should remove role from user', async () => {
      return request(app.getHttpServer())
        .delete(`/users/${userId}/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.roles).not.toContainEqual(
            expect.objectContaining({ id: roleId }),
          );
        });
    });

    it('should fail to assign role without admin token', async () => {
      const { user, accessToken: userToken } = await createTestUser(app);

      return request(app.getHttpServer())
        .post(`/users/${user.id}/roles/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail to remove role without admin token', async () => {
      const { user, accessToken: userToken } = await createTestUser(app);

      return request(app.getHttpServer())
        .delete(`/users/${user.id}/roles/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
