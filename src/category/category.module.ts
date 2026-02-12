import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Content } from '../content/entities/content.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { ContentService } from '../content/content.service';
import { InMemoryCategoryRepository } from './repository/in-memory-category.repository';
import { TypeOrmCategoryRepository } from './repository/typeorm-category.repository';
import { AppCacheModule } from '../cache/cache.module';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Content]), AppCacheModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    ContentService,
    CacheInvalidationService,
    // keep token `InMemoryCategoryRepository` for backwards compatibility but provide TypeOrm implementation
    { provide: InMemoryCategoryRepository, useClass: TypeOrmCategoryRepository },
  ],
  exports: [CategoryService, CacheInvalidationService],
})
export class CategoryModule {}
