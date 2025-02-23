import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { getTypeOrmConfig } from '../../src/config/typeorm.config';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UserModule } from '../../src/modules/user/user.module';
import { User, UserRole } from '../../src/modules/user/entities/user.entity';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';

export const createTestApp = async (): Promise<NestFastifyApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: getTypeOrmConfig,
        inject: [ConfigService],
      }),
      AuthModule,
      UserModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
};

export const createTestUser = async (
  app: NestFastifyApplication,
  overrides: Partial<User> = {},
): Promise<{ user: User; accessToken: string }> => {
  const userRepository = app.get('UserRepository');
  const jwtService = app.get(JwtService);

  const password = overrides.password || 'password123';
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await userRepository.save({
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
    ...overrides,
    password: hashedPassword, // Make sure password is always hashed
  });

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtService.sign(payload);

  return { user, accessToken };
};
