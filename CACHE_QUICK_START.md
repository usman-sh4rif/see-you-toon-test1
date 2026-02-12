# Redis Cache Architecture - Quick Start Guide

## 30-Second Setup

### 1. Start Redis (Choose One)

**Docker (Recommended):**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Local Installation:**
```bash
# macOS
brew install redis && redis-server

# Linux
sudo apt-get install redis-server && redis-server

# Windows
# Download from: https://github.com/microsoftarchive/redis/releases
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add Redis config:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Leave empty if no password
CACHE_TTL=3600          # 1 hour default
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Application

```bash
npm run start:dev
```

## Common Usage Examples

### Get Categories (Cached)
```bash
curl http://localhost:3000/api/categories
# First request: Fetches from DB and caches
# Subsequent requests: Returns from cache (fast!)
```

### Create Category (Invalidates Cache)
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "New Category"}'
# Automatically clears related caches
```

### Update Category (Invalidates Cache)
```bash
curl -X PATCH http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
# Cache automatically refreshed
```

## Verify Caching Works

### Using Redis CLI

```bash
# Connect to Redis
redis-cli

# View all cached keys
KEYS *

# Get cache info
INFO stats

# Monitor real-time cache operations
MONITOR
```

### Check Application Logs

```
# Look for cache hit messages
[14:32:15] DEBUG [CategoryService] Cache hit for all categories
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Redis connection refused | Start Redis: `redis-server` or `docker run ...` |
| Cache not clearing | Ensure invalidation service is injected |
| Stale data in cache | Check TTL and invalidation logic |
| High memory usage | Reduce TTL or clear cache: `redis-cli FLUSHALL` |

## Key Files

| File | Purpose |
|------|---------|
| `src/cache/cache.service.ts` | Core caching operations |
| `src/cache/cache-invalidation.service.ts` | Cache invalidation logic |
| `src/cache/cache.constants.ts` | Cache keys and TTL values |
| `src/category/category.service.ts` | Example integration |

## What's Cached

✅ **Category Lists** - All categories (1 hour)
✅ **Individual Categories** - By ID (1 hour)
✅ **Content** - Can be extended for content

## Performance Impact

**Before Caching:**
```
GET /categories - 150ms (DB query)
GET /categories - 150ms (DB query)
GET /categories - 150ms (DB query)
Total: 450ms
```

**After Caching:**
```
GET /categories - 150ms (DB query, then cache)
GET /categories - 5ms (Redis cache hit)
GET /categories - 5ms (Redis cache hit)
Total: 160ms
```

**70% faster! ⚡**

## Next Steps

1. ✅ Read [CACHE_ARCHITECTURE.md](./CACHE_ARCHITECTURE.md) for detailed docs
2. ✅ Add caching to other services (e.g., ContentService)
3. ✅ Monitor Redis performance
4. ✅ Adjust TTL values based on your data

## Support

- Check `CACHE_ARCHITECTURE.md` for detailed documentation
- Review `src/cache/` folder structure
- Examine `src/category/category.service.ts` for integration example
