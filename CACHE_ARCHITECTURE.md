# Redis Cache Architecture Guide

This document provides a comprehensive guide to the Redis caching architecture implemented in this project.

## Overview

The caching system provides a centralized, Redis-backed caching layer for your NestJS application, enabling quick fetching of regularly used data. It's designed to be easy to use while providing granular control over cache invalidation and TTL (Time To Live) values.

## Features

- ✅ **Global Cache Module** - Seamlessly integrated into the entire application
- ✅ **Automatic Cache Key Generation** - Structured keys prevent collisions
- ✅ **Customizable TTL** - Configure different cache durations
- ✅ **Smart Invalidation** - Automatic cache clearing on data mutations
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Error Resilient** - Graceful fallback if Redis is unavailable
- ✅ **Easy Integration** - Minimal code changes needed

## Architecture Components

### 1. **Cache Configuration** (`src/cache/cache.config.ts`)

Manages Redis connection settings via environment variables:

```typescript
// Environment Variables
REDIS_HOST=localhost      // Redis server host
REDIS_PORT=6379          // Redis server port
REDIS_PASSWORD=optional  // Redis password (if required)
CACHE_TTL=3600          // Default TTL in seconds (1 hour)
```

### 2. **Cache Service** (`src/cache/cache.service.ts`)

Core service providing cache operations:

```typescript
// Get a value from cache
const value = await cacheService.get<T>(key);

// Set a value with custom TTL
await cacheService.set<T>(key, value, 3600);

// Get or Set - fetch from cache or compute and cache
const value = await cacheService.getOrSet<T>(
  key,
  async () => await expensiveOperation(),
  3600
);

// Delete a key
await cacheService.del(key);

// Delete multiple keys
await cacheService.delMultiple([key1, key2, key3]);

// Clear entire cache
await cacheService.reset();

// Generate structured cache keys
const key = cacheService.generateKey('category', categoryId, 'stats');
// Result: "category:123:stats"
```

### 3. **Cache Constants** (`src/cache/cache.constants.ts`)

Predefined cache keys and TTL values:

```typescript
// Cache Keys
CACHE_KEYS.CATEGORY_ALL                    // all:categories
CACHE_KEYS.CATEGORY_BY_ID(id)             // category:123
CACHE_KEYS.CATEGORY_BY_NAME(name)         // category:name:Electronics
CACHE_KEYS.CATEGORY_STATS(id)             // category:stats:123
CACHE_KEYS.CONTENT_ALL                     // content:all
CACHE_KEYS.CONTENT_BY_ID(id)              // content:456
CACHE_KEYS.CONTENT_BY_CATEGORY(categoryId) // content:category:123

// TTL Values (in seconds)
CACHE_TTL.SHORT = 300         // 5 minutes
CACHE_TTL.MEDIUM = 1800       // 30 minutes
CACHE_TTL.LONG = 3600         // 1 hour
CACHE_TTL.EXTRA_LONG = 86400  // 24 hours
```

### 4. **Cache Invalidation Service** (`src/cache/cache-invalidation.service.ts`)

Manages related cache invalidation:

```typescript
// Invalidate category cache
await invalidationService.invalidateCategoryCache(categoryId);

// Invalidate all category caches
await invalidationService.invalidateCategoryCache();

// Invalidate content cache
await invalidationService.invalidateContentCache(contentId, categoryId);

// Invalidate search results
await invalidationService.invalidateSearchCache(query);

// Clear entire cache
await invalidationService.clearAllCache();
```

### 5. **Cache Decorators** (`src/cache/decorators/cache.decorator.ts`)

Simplify caching with decorators (optional):

```typescript
// Cacheable decorator
@Cacheable({ ttl: 3600, keyPrefix: 'users' })
async getUser(id: string) {
  return await this.userRepository.findOne(id);
}

// InvalidateCache decorator
@InvalidateCache(['users:*'])
async updateUser(id: string, data: UpdateUserDto) {
  return await this.userRepository.update(id, data);
}
```

## Integration with Existing Services

The caching system is already integrated into:

### Category Service

The `CategoryService` now includes caching for:

- **`list()`** - Cache all categories
- **`get(id)`** - Cache individual categories
- **`create()`** - Invalidate category cache
- **`update(id, dto)`** - Invalidate category cache
- **`remove(id)`** - Invalidate affected caches
- **`enable(id)`** / **`disable(id)`** - Invalidate category cache
- **`reorder()`** - Invalidate all category caches
- **`bulkToggle()`** - Invalidate affected caches

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Create or update `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here  # optional
CACHE_TTL=3600

# Database Configuration (existing)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=database_name
```

### 3. Start Redis Server

**Using Docker (Recommended):**

```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

**Or install locally:**

- **Windows**: Download from https://github.com/microsoftarchive/redis/releases
- **macOS**: `brew install redis`
- **Linux**: `apt-get install redis-server`

### 4. Run the Application

```bash
npm run start:dev
```

## Usage Examples

### Example 1: Basic Caching in a Service

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/cache.constants';

@Injectable()
export class UserService {
  constructor(private cacheService: CacheService) {}

  async getUser(id: string) {
    const cacheKey = CACHE_KEYS.generateKey('user', id);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      () => this.userRepository.findById(id),
      CACHE_TTL.LONG
    );
  }

  async updateUser(id: string, data: UpdateUserDto) {
    const updated = await this.userRepository.update(id, data);
    
    // Invalidate cache
    await this.cacheService.del(CACHE_KEYS.generateKey('user', id));
    
    return updated;
  }
}
```

### Example 2: Using Cache Invalidation Service

```typescript
import { Injectable } from '@nestjs/common';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';

@Injectable()
export class ProductService {
  constructor(
    private cacheInvalidationService: CacheInvalidationService,
    private productRepository: ProductRepository
  ) {}

  async updateProduct(id: string, data: UpdateProductDto) {
    const updated = await this.productRepository.update(id, data);
    
    // Invalidate related caches
    await this.cacheInvalidationService.invalidateCategoryCache(
      updated.categoryId
    );
    
    return updated;
  }
}
```

### Example 3: Manual Cache Management

```typescript
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CacheService } from './cache/cache.service';

@Controller('api/cache')
export class CacheController {
  constructor(private cacheService: CacheService) {}

  @Post('clear')
  async clearCache() {
    await this.cacheService.reset();
    return { message: 'Cache cleared' };
  }

  @Get('stats/:key')
  async getCacheStats(@Param('key') key: string) {
    const value = await this.cacheService.get(key);
    return { key, isCached: !!value, value };
  }
}
```

## Best Practices

### 1. **Use Structured Cache Keys**

```typescript
// ✅ Good - Structured and clear
const key = CACHE_KEYS.CATEGORY_BY_ID(categoryId);

// ❌ Avoid - Ambiguous
const key = `cat_${categoryId}`;
```

### 2. **Set Appropriate TTL Values**

```typescript
// ✅ Appropriate TTLs
const staticData = await cache.getOrSet(key, fn, CACHE_TTL.EXTRA_LONG);
const userPreferences = await cache.getOrSet(key, fn, CACHE_TTL.MEDIUM);
const searchResults = await cache.getOrSet(key, fn, CACHE_TTL.SHORT);

// ❌ Avoid - No TTL specified (uses default)
await cache.set(key, value);
```

### 3. **Invalidate Related Data**

```typescript
// ✅ Good - Invalidate all related caches
async update(id: string, dto: UpdateCategoryDto) {
  const result = await this.repo.update(id, dto);
  await this.invalidationService.invalidateCategoryCache(id);
  return result;
}

// ❌ Avoid - Forgetting related cache keys
async update(id: string, dto: UpdateCategoryDto) {
  return await this.repo.update(id, dto);
  // Missing: Cache invalidation!
}
```

### 4. **Handle Cache Errors Gracefully**

```typescript
// ✅ Good - Wrapped in try-catch
try {
  const value = await this.cacheService.get(key);
  return value || await this.fetchFromDB();
} catch (error) {
  this.logger.warn('Cache error, fetching from DB:', error);
  return await this.fetchFromDB();
}
```

### 5. **Use Dependency Injection**

```typescript
// ✅ Good - Proper dependency injection
@Injectable()
export class MyService {
  constructor(private cacheService: CacheService) {}
}

// ❌ Avoid - Direct instantiation
const cache = new CacheService(); // Won't work!
```

## Performance Optimization Tips

1. **Cache Frequently Accessed Data** - Categories, user profiles, common queries
2. **Avoid Caching Large Objects** - Keep cached data under 1MB
3. **Use Shorter TTL for Dynamic Data** - User-specific or frequently changing data
4. **Batch Operations** - Use `delMultiple()` for multiple deletions
5. **Monitor Redis Memory** - Set Redis `maxmemory` and `maxmemory-policy`

## Monitoring and Debugging

### Check Redis Connection

```bash
# Test Redis connection
redis-cli ping
# Output: PONG

# View all cached keys
redis-cli KEYS "*"

# Get cache info
redis-cli INFO stats

# Monitor cache operations in real-time
redis-cli MONITOR
```

### Logging

The cache service includes debug logging. Enable it:

```typescript
// In your logger configuration
import { Logger } from '@nestjs/common';

const logger = new Logger('CacheService');
logger.debug('Cache hit for key: ...'); // Shows cache hits
```

## Troubleshooting

### Issue: "Redis connection refused"

**Solution:** Ensure Redis server is running

```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
redis-server
```

### Issue: "Cache not working"

**Solution:** Verify environment variables

```bash
# Check .env file
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=3600
```

### Issue: "Stale data in cache"

**Solution:** Review cache invalidation logic

```typescript
// Ensure invalidation is called on mutations
async update(id: string, dto: UpdateDto) {
  await this.repository.update(id, dto);
  await this.cacheInvalidationService.invalidate(id);
}
```

## Adding Cache to New Services

To add caching to a new service:

1. **Inject CacheService and CacheInvalidationService**

```typescript
constructor(
  private cacheService: CacheService,
  private cacheInvalidationService: CacheInvalidationService
) {}
```

2. **Define Cache Keys** in `cache.constants.ts`

```typescript
MY_DATA: (id: string) => `mydata:${id}`,
```

3. **Add Caching to Read Methods**

```typescript
async getData(id: string) {
  const cached = await this.cacheService.get(CACHE_KEYS.MY_DATA(id));
  if (cached) return cached;
  
  const data = await this.repository.findById(id);
  await this.cacheService.set(CACHE_KEYS.MY_DATA(id), data, CACHE_TTL.LONG);
  return data;
}
```

4. **Add Invalidation to Write Methods**

```typescript
async updateData(id: string, dto: UpdateDto) {
  const updated = await this.repository.update(id, dto);
  await this.cacheInvalidationService.invalidate(id);
  return updated;
}
```

## Advanced Topics

### Custom TTL Strategies

```typescript
// Dynamic TTL based on data
function getTTL(data: any): number {
  if (data.isStatic) return CACHE_TTL.EXTRA_LONG;
  if (data.isFrequent) return CACHE_TTL.SHORT;
  return CACHE_TTL.MEDIUM;
}
```

### Cache Warming

```typescript
// Pre-populate cache on startup
async onApplicationBootstrap() {
  const categories = await this.categoryRepository.findAll();
  await this.cacheService.set(
    CACHE_KEYS.CATEGORY_ALL,
    categories,
    CACHE_TTL.LONG
  );
}
```

### Cache Statistics

```typescript
// Track cache metrics
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

// Implement tracking in CacheService
```

## Support & Resources

- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)
- [Redis Documentation](https://redis.io/documentation)
- [cache-manager](https://github.com/jaredwray/cache-manager)

---

**Last Updated:** February 2026
**Version:** 1.0.0
