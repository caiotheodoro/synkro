import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  createTestApp,
  cleanupDatabase,
  createTestUser,
} from './utils/test-utils';
import { UserRole } from '../src/modules/user/entities/user.entity';

jest.setTimeout(30000);

describe('Routing (e2e)', () => {
  let app: NestFastifyApplication;
  let accessToken: string;

  beforeEach(async () => {
    app = await createTestApp();

    // Create a test user and get access token
    const { accessToken: token } = await createTestUser(app, UserRole.ADMIN);
    accessToken = token;
  });

  afterEach(async () => {
    await cleanupDatabase(app);
  });

  describe('/api/notifications (POST)', () => {
    it('should route notification request', () => {
      return request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'test notification' })
        .expect(201);
    });
  });

  describe('/api/inventory (POST)', () => {
    it('should route inventory request', () => {
      return request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ item: 'test item' })
        .expect(201);
    });
  });

  describe('Rate Limiting', () => {
    it('should block requests after exceeding rate limit', async () => {
      const makeRequest = () =>
        request(app.getHttpServer())
          .post('/api/predictions')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ model: 'test model' });

      // Make 5 requests (rate limit for predictions)
      for (let i = 0; i < 5; i++) {
        await makeRequest().expect(201);
      }

      // The 6th request should be blocked
      await makeRequest().expect(429);
    });
  });
});
