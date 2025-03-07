import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { User } from './modules/user/entities/user.entity';
import { Role } from './modules/user/entities/role.entity';

// Load environment variables from .env file
const env = process.env.NODE_ENV || 'development';
try {
  // Try to load environment variables from .env file
  require('dotenv').config({ path: `.env.${env}` });
} catch (e) {
  console.warn('Failed to load dotenv, using process.env variables');
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'api_gateway_auth',
  entities: [User, Role],
  migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
