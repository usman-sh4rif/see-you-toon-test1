import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
import { Category } from '../category/entities/category.entity';
import { Content } from '../content/entities/content.entity';
import { CategoryTag } from '../category/entities/category-tag.entity';
import { ContentTag } from '../content/entities/content-tag.entity';
import { CategoryStat } from '../category/entities/category-stat.entity';
import { CategoryAuditLog } from '../category/entities/category-audit-log.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'seeyoutoon1',
  entities: [Category, Content, CategoryTag, ContentTag, CategoryStat, CategoryAuditLog],
  migrations: [path.join(__dirname, '../../db/migrations/*.ts')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
};
