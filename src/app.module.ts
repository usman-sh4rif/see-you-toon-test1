import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './category/category.module';
import { typeOrmConfig } from './config/database.config';
import { AppCacheModule } from './cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AppCacheModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
