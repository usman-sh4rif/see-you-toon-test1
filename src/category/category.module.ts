import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Content } from '../content/entities/content.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { ContentService } from '../content/content.service';
import { InMemoryCategoryRepository } from './repository/in-memory-category.repository';
import { TypeOrmCategoryRepository } from './repository/typeorm-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Content])],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    ContentService,
    // keep token `InMemoryCategoryRepository` for backwards compatibility but provide TypeOrm implementation
    { provide: InMemoryCategoryRepository, useClass: TypeOrmCategoryRepository },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
