import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './typeorm.config';
import { User } from '../modules/user/entities/user.entity';

describe('TypeORM Config', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USERNAME: 'test',
      DB_PASSWORD: 'test',
      DB_DATABASE: 'test_db',
      DB_SYNCHRONIZE: true,
      DB_LOGGING: false,
      DB_SSL: false,
    });

    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      const config = {
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USERNAME: 'test',
        DB_PASSWORD: 'test',
        DB_DATABASE: 'test_db',
        DB_SYNCHRONIZE: true,
        DB_LOGGING: false,
        DB_SSL: false,
      };
      return config[key];
    });
  });

  it('should return TypeORM config with provided values', () => {
    const config = getTypeOrmConfig(configService);

    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'test',
      password: 'test',
      database: 'test_db',
      entities: [User],
      synchronize: true,
      logging: false,
      ssl: false,
    });
  });

  it('should use default values when environment variables are not set', () => {
    jest
      .spyOn(configService, 'get')
      .mockImplementation((key: string, defaultValue: any) => defaultValue);
    const config = getTypeOrmConfig(configService);

    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'api_gateway_auth',
      entities: [User],
      synchronize: false,
      logging: false,
      ssl: false,
    });
  });
});
