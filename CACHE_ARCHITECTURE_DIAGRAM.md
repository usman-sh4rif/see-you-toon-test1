# Redis Cache Architecture - System Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Application                          │
│                  (HTTP Requests/Responses)                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Application                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Controllers                           │  │
│  │         (CategoryController, etc.)                       │  │
│  └───────────┬──────────────────────────────────────────────┘  │
│              │                                                   │
│  ┌───────────▼──────────────────────────────────────────────┐  │
│  │                    Services                              │  │
│  │     (CategoryService, ContentService, etc.)             │  │
│  │              ▲              ▲                            │  │
│  │              │              │                            │  │
│  │    ┌─────────┴─────┐    ┌──┴─────────┐                 │  │
│  │    │                │    │            │                 │  │
│  ├────┼─────────────────┼────┼────────────┼─────────────────┤  │
│  │    │                │    │            │                 │  │
│  │  ┌─▼────────────────▼┐ ┌─▼────────────▼─┐              │  │
│  │  │  CacheService    │ │CacheInvalidation│              │  │
│  │  │  - get()         │ │Service          │              │  │
│  │  │  - set()         │ │- invalidate()   │              │  │
│  │  │  - getOrSet()    │ │- clear()        │              │  │
│  │  │  - del()         │ │- bulkInvalidate │              │  │
│  │  │  - reset()       │ │                 │              │  │
│  │  └─┬────────────────┘ └─┬───────────────┘              │  │
│  │    │                    │                              │  │
│  │    └────────┬───────────┘                              │  │
│  │             │                                          │  │
│  └─────────────┼──────────────────────────────────────────┘  │
│                │                                              │
│    ┌───────────▼────────────┐                                │
│    │  AppCacheModule        │                                │
│    │  (Global Provider)     │                                │
│    └───────────┬────────────┘                                │
│                │                                              │
│    ┌───────────▼────────────┐                                │
│    │  CacheModule.register()│                                │
│    │  (Configuration)       │                                │
│    └───────────┬────────────┘                                │
│                │                                              │
└────────────────┼──────────────────────────────────────────────┘
                 │
                 ▼
       ┌─────────────────────┐
       │   Redis Server      │
       │  (Cache Layer)      │
       │  - Store data       │
       │  - TTL management   │
       │  - Memory mgmt      │
       └─────────────────────┘
```

## Data Flow - Read Operation (GET)

```
                    GET Request
                         │
                         ▼
                 ┌──────────────────┐
                 │   Controller     │
                 │  get(id)         │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    Service       │
                 │  get(id)         │
                 └────────┬─────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  CacheService.get()   │
              │  (Check Cache)        │
              └────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼ (Hit)              ▼ (Miss)
    ┌────────┐          ┌──────────────────┐
    │ Cache  │          │  Repository      │
    │ Found  │          │  Query Database  │
    └────┬───┘          └────────┬─────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         │              │ CacheService.set │
         │              │ (Store in Cache) │
         │              └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Response to     │
            │  Client          │
            └──────────────────┘
```

## Data Flow - Write Operation (POST/PUT/DELETE)

```
                  POST/PUT/DELETE Request
                         │
                         ▼
                 ┌──────────────────┐
                 │   Controller     │
                 │  create/update/  │
                 │  delete(data)    │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    Service       │
                 │  create/update/  │
                 │  delete(data)    │
                 └────────┬─────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Repository           │
              │  create/update/delete │
              │  (Modify Database)    │
              └────────┬──────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │ CacheInvalidationService    │
         │ invalidate() / del()        │
         └────────┬────────────────────┘
                  │
          ┌───────▼──────┐
          │ Redis Cache  │
          │ - REMOVE KEY │
          │ - EXPIRE KEY │
          │ - FLUSH DB   │
          └──────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │  Response           │
         │  Success/Error      │
         └─────────────────────┘
```

## Cache Invalidation Patterns

```
┌─────────────────────────────────────────────────────────┐
│                    Database Update                       │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ┌────────────────┐   ┌────────────────┐
    │  Specific Key  │   │   Pattern      │
    │   Invalidation │   │   Invalidation │
    │                │   │                │
    │  category:123  │   │  category:*    │
    │  ─────────────►│   │  ─────────────►│
    │                │   │                │
    └────────────────┘   └────────────────┘
              │                    │
              ▼                    ▼
    ┌────────────────┐   ┌────────────────┐
    │ Targeted       │   │ Wildcard       │
    │ Cache Miss     │   │ Cache Miss     │
    │                │   │                │
    │ Fast, Precise  │   │ Slower, Safer  │
    └────────────────┘   └────────────────┘
```

## Category Service Cache Integration

```
┌──────────────────────────────────────────────────────────────┐
│                    CategoryService                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  READ OPERATIONS (Cacheable)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ list()                                              │   │
│  │ └─ CACHE_KEY: "categories:all"                      │   │
│  │ └─ TTL: CACHE_TTL.LONG (3600s)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ get(id)                                             │   │
│  │ └─ CACHE_KEY: "category:123"                        │   │
│  │ └─ TTL: CACHE_TTL.LONG (3600s)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  WRITE OPERATIONS (Invalidating)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ create(dto)                                         │   │
│  │ └─ Invalidate: "categories:all"                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ update(id, dto)                                     │   │
│  │ └─ Invalidate: "category:123" + "categories:all"   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ remove(id)                                          │   │
│  │ └─ Invalidate: "category:123" + "categories:all"   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ bulkToggle(ids, active)                             │   │
│  │ └─ Invalidate: All affected category keys           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Cache Key Hierarchy

```
┌─────────────────────────────────────────────────────┐
│            CACHE KEY STRUCTURE                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  categories:all                                     │
│  ├── category:123                                   │
│  ├── category:456                                   │
│  └── category:789                                   │
│                                                     │
│  category:123:stats                                 │
│  category:123:tags                                  │
│                                                     │
│  content:all                                        │
│  ├── content:456                                    │
│  └── content:789                                    │
│                                                     │
│  content:category:123                               │
│  ├── content:456 (belongs to category 123)          │
│  └── content:789 (belongs to category 123)          │
│                                                     │
│  search:electronics                                 │
│  search:anime                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Dependency Injection Flow

```
┌───────────────────────────────────────────────────────────┐
│                   AppModule                               │
│                                                           │
│  imports: [                                               │
│    TypeOrmModule.forRoot(),                              │
│    AppCacheModule,  ◄────────┐ GLOBAL INJECTION          │
│    CategoryModule,            │                           │
│  ]                            │                           │
└────────────────────┬──────────┼──────────────────────────┘
                     │          │
         ┌───────────▼──────┐  │
         │ AppCacheModule   │  │
         │                  │  │
         │  imports: [      │  │
         │    CacheModule   │  │
         │  ]               │  │
         │                  │  │
         │  providers: [    │  │
         │    CacheService  │  │
         │  ]               │  │
         │                  │  │
         │  exports: [      │  │
         │    CacheService  │  ├────── Available everywhere
         │  ]               │  │
         └──────────────────┘  │
                     ▲          │
                     │          │
         ┌───────────┴──────┐  │
         │ CategoryModule   │◄─┘
         │                  │
         │ imports: [       │
         │   AppCacheModule │
         │ ]                │
         │                  │
         │ providers: [     │
         │   CategoryService│
         │ ]                │
         │                  │
         │ CategoryService  │
         │ constructor(     │
         │   private cache: │
         │   CacheService   │
         │ )                │
         └──────────────────┘
```

## TTL Management Timeline

```
Time ────────────────────────────────────────────────────────►

Data Cached
   │
   │ <──── TTL Duration (3600s = 1 hour) ──────►
   │
   ├─ 0s   ────────── Fresh (100% valid)
   │
   ├─ 30m  ────────── Still Valid
   │
   ├─ 59m  ────────── Approaching Expiry
   │
   └─ 60m  ────────── EXPIRED
            │
            ├─ Request arrives
            │
            ├─ Cache MISS (expired)
            │
            └─ Fetch from DB
               │
               └─ Re-cache for next 60 minutes
```

## Memory Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Redis Memory                           │
│            (Default: unlimited)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Categories   │  │  Content     │  │  Search      │ │
│  │ (1-5MB)      │  │  (10-50MB)   │  │  (5-10MB)    │ │
│  │              │  │              │  │              │ │
│  │ ~5K entries  │  │ ~50K entries │  │ ~1K entries  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Users        │  │ Other        │                    │
│  │ (5-10MB)     │  │ (Free/Future)│                    │
│  └──────────────┘  └──────────────┘                    │
│                                                         │
│  Total Used: ~30-80MB                                  │
│  Recommended: 256MB                                    │
│  Max Entries: 100                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Scaling Considerations

```
┌────────────────────────────────────────────────────────┐
│           HORIZONTAL SCALING ARCHITECTURE               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Application Instances                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Server 1    │  │ Server 2    │  │ Server N    │  │
│  │ Port 3001   │  │ Port 3002   │  │ Port 300N   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          │                          │
│                 ┌────────▼────────┐                │
│                 │ Shared Redis    │                │
│                 │ Single Instance │                │
│                 │ (Consistent)    │                │
│                 └─────────────────┘                │
│                                                    │
│  Benefits:                                        │
│  ✓ All servers share same cache                  │
│  ✓ Consistent data across instances              │
│  ✓ Single source of truth                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

**Architecture Version:** 1.0
**Last Updated:** February 2026
