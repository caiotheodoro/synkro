import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { User } from '../src/modules/user/entities/user.entity';
import { Role } from '../src/modules/user/entities/role.entity';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserService } from '../src/modules/user/user.service';
import { RoleService } from '../src/modules/user/role.service';

describe('User and Role Management (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userService: UserService;
  let roleService: RoleService;
  let adminToken: string;
  let userId: string;
  let roleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_DATABASE'),
            entities: [User, Role],
            synchronize: true,
            dropSchema: true,
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    userService = moduleFixture.get<UserService>(UserService);
    roleService = moduleFixture.get<RoleService>(RoleService);

    // Create admin user and get token
    const adminUser = await authService.register({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
    });
    adminToken = adminUser.access_token;
    userId = adminUser.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Roles', () => {
    const createRoleDto = {
      name: 'test-role',
      permissions: ['read:users', 'write:users'],
      description: 'Test role',
    };

    it('should create a new role', () => {
      return request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(createRoleDto.name);
          expect(res.body.permissions).toEqual(createRoleDto.permissions);
          roleId = res.body.id;
        });
    });

    it('should get all roles', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should get role by id', () => {
      return request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(roleId);
          expect(res.body.name).toBe(createRoleDto.name);
        });
    });

    it('should update role', () => {
      const updateDto = {
        description: 'Updated description',
      };

      return request(app.getHttpServer())
        .patch(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe(updateDto.description);
        });
    });

    it('should add permission to role', () => {
      return request(app.getHttpServer())
        .post(`/roles/${roleId}/permissions/delete:users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.permissions).toContain('delete:users');
        });
    });

    it('should remove permission from role', () => {
      return request(app.getHttpServer())
        .delete(`/roles/${roleId}/permissions/delete:users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.permissions).not.toContain('delete:users');
        });
    });
  });

  describe('Users', () => {
    it('should get all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should get user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
        });
    });

    it('should update user', () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe(updateDto.firstName);
          expect(res.body.lastName).toBe(updateDto.lastName);
        });
    });

    it('should assign role to user', () => {
      return request(app.getHttpServer())
        .post(`/users/${userId}/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.roles).toContainEqual(
            expect.objectContaining({ id: roleId }),
          );
        });
    });

    it('should remove role from user', () => {
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
  });
});
