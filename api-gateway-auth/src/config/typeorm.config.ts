import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/user/entities/user.entity';
import { Role } from '../modules/user/entities/role.entity';
import { join } from 'path';

export function getTypeOrmConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: parseInt(configService.get('DB_PORT', '5432'), 10),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'api_gateway_auth'),
    entities: [User, Role],
    synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
    logging: configService.get('DB_LOGGING', 'false') === 'true',
    ssl: configService.get('DB_SSL', 'false') === 'true',
    migrations: [join(__dirname, '../migrations/**/*{.ts,.js}')],
    migrationsRun: configService.get('DB_MIGRATIONS_RUN', 'true') === 'true',
  };
}

export const dataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'api_gateway_auth',
  entities: [User, Role],
  migrations: [join(__dirname, '../migrations/**/*{.ts,.js}')],
  synchronize: false,
};
