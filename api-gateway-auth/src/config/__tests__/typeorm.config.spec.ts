import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '../typeorm.config';
import { User } from '../../modules/user/entities/user.entity';
import { Role } from '../../modules/user/entities/role.entity';

describe('TypeORM Config', () => {
  it('should use default values when environment variables are not set', () => {
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'DB_HOST':
            return 'localhost';
          case 'DB_PORT':
            return '5436';
          case 'DB_USERNAME':
            return 'postgres';
          case 'DB_PASSWORD':
            return 'postgres';
          case 'DB_DATABASE':
            return 'api_gateway_auth';
          case 'DB_SSL':
            return 'false';
          case 'DB_SYNCHRONIZE':
            return 'false';
          case 'DB_LOGGING':
            return 'false';
          default:
            return undefined;
        }
      }),
    } as unknown as ConfigService;

    const config = getTypeOrmConfig(configService);

    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5436,
      username: 'postgres',
      password: 'postgres',
      database: 'api_gateway_auth',
      entities: [User, Role],
      synchronize: false,
      logging: false,
      ssl: false,
    });
  });

  it('should return TypeORM config with provided values', () => {
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'DB_HOST':
            return 'localhost';
          case 'DB_PORT':
            return '5436';
          case 'DB_USERNAME':
            return 'test';
          case 'DB_PASSWORD':
            return 'test';
          case 'DB_DATABASE':
            return 'test_db';
          case 'DB_SSL':
            return 'false';
          case 'DB_SYNCHRONIZE':
            return 'false';
          case 'DB_LOGGING':
            return 'false';
          default:
            return undefined;
        }
      }),
    } as unknown as ConfigService;

    const config = getTypeOrmConfig(configService);

    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5436,
      username: 'test',
      password: 'test',
      database: 'test_db',
      entities: [User, Role],
      synchronize: false,
      logging: false,
      ssl: false,
    });
  });
});
