import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '../typeorm.config';
import { User } from '../../modules/user/entities/user.entity';

describe('TypeORM Config', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USERNAME: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_DATABASE: 'test',
      DB_SYNCHRONIZE: false,
      DB_LOGGING: false,
    });
  });

  it('should return TypeORM config with provided values', () => {
    const config = getTypeOrmConfig(configService);

    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'test',
      entities: [User],
      synchronize: false,
      logging: false,
      ssl: false,
    });
  });

  it('should use default values when environment variables are not set', () => {
    configService = new ConfigService({});
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
