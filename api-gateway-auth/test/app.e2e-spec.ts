import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp, createTestUser } from './utils/test-utils';
import { UserRole } from '../src/modules/user/entities/user.entity';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
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
      it('should get all users as admin', async () => {
        const { accessToken } = await createTestUser(app, {
          role: UserRole.ADMIN,
        });

        const response = await app.inject({
          method: 'GET',
          url: '/users',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(Array.isArray(body)).toBe(true);
        if (body.length > 0) {
          expect(body[0].email).toBeDefined();
          expect(body[0].password).toBeUndefined();
        }
      });

      it('should return 403 for non-admin users', async () => {
        const { accessToken } = await createTestUser(app);

        const response = await app.inject({
          method: 'GET',
          url: '/users',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(403);
      });
    });

    describe('GET /users/:id', () => {
      it('should get user by id', async () => {
        const { user, accessToken } = await createTestUser(app);

        const response = await app.inject({
          method: 'GET',
          url: `/users/${user.id}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.email).toBe(user.email);
        expect(body.password).toBeUndefined();
      });

      it('should return 404 for non-existent user', async () => {
        const { accessToken } = await createTestUser(app);

        const response = await app.inject({
          method: 'GET',
          url: '/users/999',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('PATCH /users/:id', () => {
      it('should update user', async () => {
        const { user, accessToken } = await createTestUser(app);
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
        };

        const response = await app.inject({
          method: 'PATCH',
          url: `/users/${user.id}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: updateData,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.firstName).toBe(updateData.firstName);
        expect(body.lastName).toBe(updateData.lastName);
      });

      it('should return 403 when updating other user as non-admin', async () => {
        const { accessToken } = await createTestUser(app);
        const { user } = await createTestUser(app);

        const response = await app.inject({
          method: 'PATCH',
          url: `/users/${user.id}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: { firstName: 'Updated' },
        });

        expect(response.statusCode).toBe(403);
      });
    });

    describe('DELETE /users/:id', () => {
      it('should delete user', async () => {
        const { user, accessToken } = await createTestUser(app);

        const response = await app.inject({
          method: 'DELETE',
          url: `/users/${user.id}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
      });

      it('should return 403 when deleting other user as non-admin', async () => {
        const { accessToken } = await createTestUser(app);
        const { user } = await createTestUser(app);

        const response = await app.inject({
          method: 'DELETE',
          url: `/users/${user.id}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(403);
      });
    });

    describe('PATCH /users/:id/active', () => {
      it('should update user active status as admin', async () => {
        const { accessToken } = await createTestUser(app, {
          role: UserRole.ADMIN,
        });
        const { user } = await createTestUser(app);

        const response = await app.inject({
          method: 'PATCH',
          url: `/users/${user.id}/active`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: { isActive: false },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.isActive).toBe(false);
      });

      it('should return 403 when updating active status as non-admin', async () => {
        const { accessToken } = await createTestUser(app);
        const { user } = await createTestUser(app);

        const response = await app.inject({
          method: 'PATCH',
          url: `/users/${user.id}/active`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: { isActive: false },
        });

        expect(response.statusCode).toBe(403);
      });
    });
  });
});
