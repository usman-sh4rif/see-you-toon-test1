import { CacheModuleOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';

export const cacheConfig: CacheModuleOptions = {
  isGlobal: true,
  store: redisStore as unknown as string,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  auth_pass: process.env.REDIS_PASSWORD,
  ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // Default 1 hour
  max: 100, // Maximum number of items stored
} as CacheModuleOptions & RedisClientOptions;
