import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp,
  cleanupDatabase,
  createTestUser,
} from './utils/test-utils';
import { UserRole } from '../src/modules/user/entities/user.entity';
import { UserService } from '../src/modules/user/user.service';
import { AuthService } from '../src/modules/auth/auth.service';
import * as request from 'supertest';

jest.setTimeout(30000); // Increase timeout to 30 seconds

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;
  let userService: UserService;
  let authService: AuthService;

  beforeEach(async () => {
    app = await createTestApp();
    userService = app.get(UserService);
    authService = app.get(AuthService);
  });

  afterEach(async () => {
    await cleanupDatabase(app);
  });

  describe('Auth', () => {
    describe('POST /auth/register', () => {
      it('should register a new user', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: `test-${Date.now()}@example.com`,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
          },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.access_token).toBeDefined();
        expect(body.user).toBeDefined();
        expect(body.user.email).toBeDefined();
        expect(body.user.password).toBeUndefined();
      });

      it('should return 409 when email already exists', async () => {
        const { user } = await createTestUser(app);
        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: user.email,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
          },
        });

        expect(response.statusCode).toBe(409);
      });
    });

    describe('POST /auth/login', () => {
      it('should login successfully', async () => {
        const testPassword = 'password123';
        const { user } = await createTestUser(app, { password: testPassword });

        const response = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: {
            email: user.email,
            password: testPassword,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.access_token).toBeDefined();
        expect(body.user).toBeDefined();
        expect(body.user.email).toBe(user.email);
        expect(body.user.password).toBeUndefined();
      });

      it('should return 401 with invalid credentials', async () => {
        const { user } = await createTestUser(app);

        const response = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: {
            email: user.email,
            password: 'wrongpassword',
          },
        });

        expect(response.statusCode).toBe(401);
      });
    });

    describe('GET /auth/profile', () => {
      it('should get user profile', async () => {
        const { user, accessToken } = await createTestUser(app);

        const response = await app.inject({
          method: 'GET',
          url: '/auth/profile',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.email).toBe(user.email);
        expect(body.password).toBeUndefined();
      });

      it('should return 401 without token', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/auth/profile',
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Users', () => {
    describe('GET /users', () => {
      it('should return 403 for non-admin users', async () => {
        const { user, accessToken } = await createTestUser(app);

        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(403);
      });

      it('should return users list for admin', async () => {
        const { accessToken } = await createTestUser(app, UserRole.ADMIN);

        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /users/:id', () => {
      it('should return 404 for non-existent user', async () => {
        const { accessToken } = await createTestUser(app, UserRole.ADMIN);
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        const response = await request(app.getHttpServer())
          .get(`/users/${nonExistentId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(404);
      });

      it('should return user details for admin', async () => {
        const { user, accessToken } = await createTestUser(app, UserRole.ADMIN);

        const response = await request(app.getHttpServer())
          .get(`/users/${user.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(user.id);
      });
    });

    describe('PATCH /users/:id', () => {
      it('should return 403 when updating other user as non-admin', async () => {
        const { accessToken: userToken } = await createTestUser(app);
        const { user: otherUser } = await createTestUser(app);

        const response = await request(app.getHttpServer())
          .patch(`/users/${otherUser.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ firstName: 'Updated' });

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to update other users', async () => {
        const { accessToken: adminToken } = await createTestUser(
          app,
          UserRole.ADMIN,
        );
        const { user: otherUser } = await createTestUser(app);

        const response = await request(app.getHttpServer())
          .patch(`/users/${otherUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ firstName: 'Updated' });

        expect(response.statusCode).toBe(200);
        expect(response.body.firstName).toBe('Updated');
      });
    });

    describe('DELETE /users/:id', () => {
      it('should return 403 when deleting other user as non-admin', async () => {
        const { accessToken: userToken } = await createTestUser(app);
        const { user: otherUser } = await createTestUser(app);

        const response = await request(app.getHttpServer())
          .delete(`/users/${otherUser.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to delete other users', async () => {
        const { accessToken: adminToken } = await createTestUser(
          app,
          UserRole.ADMIN,
        );
        const { user: otherUser } = await createTestUser(app);

        const response = await request(app.getHttpServer())
          .delete(`/users/${otherUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
      });
    });

    describe('PATCH /users/:id/active', () => {
      it('should return 403 when updating active status as non-admin', async () => {
        const { accessToken: userToken } = await createTestUser(app);
        const { user: otherUser } = await createTestUser(app);

        const response = await request(app.getHttpServer())
          .patch(`/users/${otherUser.id}/active`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ isActive: false });

        expect(response.statusCode).toBe(403);
      });

      it('should allow admin to update active status', async () => {
        const { accessToken: adminToken } = await createTestUser(
          app,
          UserRole.ADMIN,
        );
        const { user: otherUser } = await createTestUser(app);

        const response = await request(app.getHttpServer())
          .patch(`/users/${otherUser.id}/active`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false });

        expect(response.statusCode).toBe(200);
        expect(response.body.isActive).toBe(false);
      });
    });
  });
});
