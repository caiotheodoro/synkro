import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UserModule } from '../../src/user/user.module';
import { User, UserRole } from '../../src/user/entities/user.entity';
import { Role } from '../../src/user/entities/role.entity';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { UserService } from '../../src/user/user.service';
import { AuthService } from '../../src/modules/auth/auth.service';

export const createTestApp = async (): Promise<NestFastifyApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          schema: 'public',
          entities: [User, Role],
          synchronize: true,
          dropSchema: true,
          logging: false,
          ssl: false,
          maxQueryExecutionTime: 1000,
          extra: {
            max: 1,
            idleTimeoutMillis: 1000,
          },
        }),
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  // Get the DataSource and ensure the database is clean
  const dataSource = moduleFixture.get<DataSource>(DataSource);

  try {
    // Ensure we're connected
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Drop and recreate schema
    await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS public');
    await dataSource.query('GRANT ALL ON SCHEMA public TO postgres');
    await dataSource.query('GRANT ALL ON SCHEMA public TO public');

    // Create UUID extension if it doesn't exist
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Synchronize the database
    await dataSource.synchronize(true);
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }

  return app;
};

export const cleanupDatabase = async (app: NestFastifyApplication) => {
  if (!app) return;

  try {
    const dataSource = app.get<DataSource>(DataSource);

    if (dataSource && dataSource.isInitialized) {
      // Drop all tables but keep the schema
      await dataSource.dropDatabase();

      // Close the connection
      await dataSource.destroy();
    }
  } catch (error) {
    console.error('Database cleanup error:', error);
  }

  await app.close();
};

export const createTestUser = async (
  app: NestFastifyApplication,
  roleOrOptions:
    | UserRole
    | { role?: UserRole; password?: string } = UserRole.USER,
): Promise<{ user: User; accessToken: string }> => {
  const userService = app.get(UserService);
  const authService = app.get(AuthService);

  const role =
    typeof roleOrOptions === 'string'
      ? roleOrOptions
      : roleOrOptions.role || UserRole.USER;
  const password =
    typeof roleOrOptions === 'string'
      ? 'password123'
      : roleOrOptions.password || 'password123';

  const user = await userService.create({
    email: `test-${Date.now()}@example.com`,
    password,
    firstName: 'Test',
    lastName: 'User',
    role,
  });

  const { access_token } = await authService.login(user.email, password);

  return { user, accessToken: access_token };
};
