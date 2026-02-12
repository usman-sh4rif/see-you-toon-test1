import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { cacheConfig } from './cache.config';
import { CacheService } from './cache.service';

@Module({
  imports: [CacheModule.register(cacheConfig)],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
