# Redis Cache Architecture - Testing Guide

## Unit Testing Caching Logic

### 1. Testing CacheService

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          isGlobal: true,
          ttl: 300,
        }),
      ],
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('get', () => {
    it('should return cached value', async () => {
      await cacheManager.set('test-key', 'test-value');
      const result = await service.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return undefined for non-existent key', async () => {
      const result = await service.get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      await service.set('test-key', 'test-value', 100);
      const result = await cacheManager.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should respect TTL', async () => {
      await service.set('test-key', 'test-value', 1);
      await new Promise(resolve => setTimeout(resolve, 1100));
      const result = await service.get('test-key');
      expect(result).toBeUndefined();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value without calling factory', async () => {
      const factory = jest.fn().mockResolvedValue('factory-value');
      
      await service.set('test-key', 'cached-value');
      const result = await service.getOrSet('test-key', factory);
      
      expect(result).toBe('cached-value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache value if not cached', async () => {
      const factory = jest.fn().mockResolvedValue('factory-value');
      
      const result = await service.getOrSet('test-key', factory, 100);
      
      expect(result).toBe('factory-value');
      expect(factory).toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      await service.set('test-key', 'test-value');
      await service.del('test-key');
      const result = await service.get('test-key');
      expect(result).toBeUndefined();
    });
  });

  describe('generateKey', () => {
    it('should generate structured key', () => {
      const key = service.generateKey('category', '123', 'stats');
      expect(key).toBe('category:123:stats');
    });
  });
});
```

### 2. Testing CacheInvalidationService

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { CacheInvalidationService } from './cache-invalidation.service';
import { CACHE_KEYS } from './cache.constants';

describe('CacheInvalidationService', () => {
  let service: CacheInvalidationService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationService,
        {
          provide: CacheService,
          useValue: {
            del: jest.fn(),
            delMultiple: jest.fn(),
            reset: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CacheInvalidationService>(
      CacheInvalidationService,
    );
    cacheService = module.get<CacheService>(CacheService);
  });

  describe('invalidateCategoryCache', () => {
    it('should invalidate all category caches', async () => {
      await service.invalidateCategoryCache();
      expect(cacheService.del).toHaveBeenCalledWith(CACHE_KEYS.CATEGORY_ALL);
    });

    it('should invalidate specific category cache', async () => {
      await service.invalidateCategoryCache('123');
      expect(cacheService.delMultiple).toHaveBeenCalled();
    });
  });

  describe('clearAllCache', () => {
    it('should reset all cache', async () => {
      await service.clearAllCache();
      expect(cacheService.reset).toHaveBeenCalled();
    });
  });
});
```

### 3. Testing CategoryService with Caching

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { InMemoryCategoryRepository } from './repository/in-memory-category.repository';
import { CacheService } from '../cache/cache.service';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/cache.constants';

describe('CategoryService with Caching', () => {
  let service: CategoryService;
  let repository: InMemoryCategoryRepository;
  let cacheService: CacheService;
  let invalidationService: CacheInvalidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: InMemoryCategoryRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delMultiple: jest.fn(),
          },
        },
        {
          provide: CacheInvalidationService,
          useValue: {
            invalidateCategoryCache: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get<InMemoryCategoryRepository>(
      InMemoryCategoryRepository,
    );
    cacheService = module.get<CacheService>(CacheService);
    invalidationService = module.get<CacheInvalidationService>(
      CacheInvalidationService,
    );
  });

  describe('list', () => {
    it('should return cached categories', async () => {
      const mockCategories = [{ id: '1', name: 'Category 1' }];
      (cacheService.get as jest.Mock).mockResolvedValue(mockCategories);

      const result = await service.list();

      expect(result).toEqual(mockCategories);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      const mockCategories = [{ id: '1', name: 'Category 1' }];
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (repository.findAll as jest.Mock).mockResolvedValue(mockCategories);

      const result = await service.list();

      expect(result).toEqual(mockCategories);
      expect(cacheService.set).toHaveBeenCalledWith(
        CACHE_KEYS.CATEGORY_ALL,
        mockCategories,
        CACHE_TTL.LONG,
      );
    });
  });

  describe('create', () => {
    it('should invalidate cache after create', async () => {
      const mockCategory = { id: '1', name: 'New Category' };
      (repository.create as jest.Mock).mockResolvedValue(mockCategory);

      await service.create({ name: 'New Category' });

      expect(invalidationService.invalidateCategoryCache).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should invalidate cache after update', async () => {
      const mockCategory = { id: '1', name: 'Updated Category' };
      (repository.findById as jest.Mock).mockResolvedValue(mockCategory);
      (repository.update as jest.Mock).mockResolvedValue(mockCategory);

      await service.update('1', { name: 'Updated Category' });

      expect(invalidationService.invalidateCategoryCache).toHaveBeenCalledWith(
        '1',
      );
    });
  });
});
```

## Integration Testing

### 1. Testing with Real Redis

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';

describe('Cache Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/categories', () => {
    it('should cache results on first request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return cached results on second request', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);
      const duration = Date.now() - start;

      // Second request should be significantly faster (< 10ms)
      expect(duration).toBeLessThan(10);
    });
  });

  describe('POST /api/categories', () => {
    it('should invalidate cache on create', async () => {
      // First, warm up the cache
      await request(app.getHttpServer()).get('/api/categories').expect(200);

      // Create new category
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'New Category' })
        .expect(201);

      // The cache should be invalidated
      // (Next GET should fetch from DB again)
    });
  });
});
```

## Manual Testing Procedures

### 1. Cache Hit/Miss Testing

```bash
# Terminal 1: Start Redis monitoring
redis-cli MONITOR

# Terminal 2: Test cache
# First request (MISS)
curl http://localhost:3000/api/categories

# Second request (HIT) - should be faster
curl http://localhost:3000/api/categories

# View in Terminal 1 - should see SETEX then GET commands
```

### 2. Performance Testing

```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/api/categories

# Expected results:
# First batch: ~150ms per request (DB hits)
# Subsequent: ~5ms per request (cache hits)
```

### 3. Cache Invalidation Testing

```bash
# Check cache before operation
redis-cli KEYS "*"

# Create new category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# Check cache after - should show cleared keys
redis-cli KEYS "*"

# GET should be slower (cache miss)
curl http://localhost:3000/api/categories
```

### 4. TTL Testing

```bash
# Set short TTL for testing
# In .env: CACHE_TTL=5

# Get categories (cached for 5 seconds)
curl http://localhost:3000/api/categories

# Immediate retry - should be fast (cache hit)
curl http://localhost:3000/api/categories

# Wait 6 seconds
sleep 6

# Retry - should be slow (cache expired)
curl http://localhost:3000/api/categories
```

## Performance Benchmarking

### 1. Load Testing Script

```bash
#!/bin/bash
# benchmark.sh

echo "Warming up cache..."
for i in {1..5}; do
  curl -s http://localhost:3000/api/categories > /dev/null
done

echo "Load testing (100 requests)..."
time ab -n 100 -c 10 http://localhost:3000/api/categories

echo "Performance analysis:"
redis-cli INFO stats | grep -E "total_commands_processed|instantaneous_ops_per_sec"
```

### 2. Expected Benchmark Results

```
Without Cache:
Requests per second: 6.67
Mean time per request: 150ms
Total time: 15 seconds

With Cache:
Requests per second: 200
Mean time per request: 5ms
Total time: 0.5 seconds

Improvement: ~30x faster!
```

## Debugging Techniques

### 1. Enable Debug Logging

```typescript
// In CategoryService
this.logger.debug('Cache hit for all categories');
this.logger.debug(`Cache hit for category ${id}`);
this.logger.debug(`Invalidated cache for category ${id}`);
```

### 2. Redis CLI Debugging

```bash
# Monitor all commands
redis-cli MONITOR

# Check specific key
redis-cli GET "categories:all"

# Check key expiration
redis-cli TTL "category:123"

# Get memory usage
redis-cli INFO memory

# Get stats
redis-cli INFO stats
```

### 3. Application Logs Analysis

```bash
# Filter for cache operations
grep -i cache app.log

# Filter for cache errors
grep -i "cache error" app.log

# Filter for cache hits/misses
grep -E "Cache (hit|miss)" app.log
```

## Test Checklist

- [ ] **Unit Tests**
  - [ ] CacheService get/set/delete operations
  - [ ] Cache key generation
  - [ ] TTL management
  - [ ] Error handling

- [ ] **Integration Tests**
  - [ ] Service-level caching
  - [ ] Cache invalidation
  - [ ] Concurrent requests
  - [ ] Redis connection failures

- [ ] **Performance Tests**
  - [ ] Cache hit response time < 10ms
  - [ ] Cache miss response time < 200ms
  - [ ] Memory usage within limits
  - [ ] Load testing with 100+ requests

- [ ] **Manual Tests**
  - [ ] Redis connection works
  - [ ] Cache is being written
  - [ ] Cache is being read
  - [ ] Cache invalidation works
  - [ ] TTL expiration works
  - [ ] Stale data handling

## Continuous Integration

### Sample GitHub Actions Workflow

```yaml
name: Cache Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run test
      - run: npm run test:e2e
```

---

**Testing Guide Version:** 1.0
**Last Updated:** February 2026
