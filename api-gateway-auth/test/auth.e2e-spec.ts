import * as request from 'supertest';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserService } from '../src/modules/user/user.service';
import { createTestApp, cleanupDatabase } from './utils/test-utils';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

jest.setTimeout(30000); // Increase timeout to 30 seconds

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  let authService: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    app = await createTestApp();
    authService = app.get(AuthService);
    userService = app.get(UserService);
  });

  afterEach(async () => {
    await cleanupDatabase(app);
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.password).toBeUndefined();
        });
    });

    it('should fail to register with existing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test',
        })
        .expect(409);
    });

    it('should fail to register with invalid data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const loginDto = {
      email: 'login-test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      await userService.create({
        ...loginDto,
        name: 'Test',
      });
    });

    it('should login successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(loginDto.email);
          expect(res.body.user.password).toBeUndefined();
        });
    });

    it('should fail to login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...loginDto,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'profile-test@example.com',
          password: 'password123',
          name: 'Test',
        });

      accessToken = response.body.access_token;
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('profile-test@example.com');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should fail to get profile without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail to get profile with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
