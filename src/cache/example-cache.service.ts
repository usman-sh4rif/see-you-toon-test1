import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/cache.constants';

/**
 * Example service demonstrating best practices for cache integration
 * Copy this pattern to other services in your application
 */
@Injectable()
export class ExampleCacheService {
  private readonly logger = new Logger(ExampleCacheService.name);

  constructor(
    private cacheService: CacheService,
    private cacheInvalidationService: CacheInvalidationService,
    // private repository: YourRepository,
  ) {}

  /**
   * Example: Get all items with caching
   * Pattern: List endpoint - cache frequently accessed data
   */
  async getAllItems(): Promise<any[]> {
    const cacheKey = CACHE_KEYS.CATEGORY_ALL; // Use appropriate key

    try {
      // Try to get from cache
      const cached = await this.cacheService.get<any[]>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for all items');
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache retrieval error:', error);
      // Continue to fetch from DB
    }

    // Fetch from database
    const items = []; // await this.repository.findAll();

    // Store in cache
    try {
      await this.cacheService.set(cacheKey, items, CACHE_TTL.LONG);
    } catch (error) {
      this.logger.warn('Cache set error:', error);
      // Return data anyway - cache is optional
    }

    return items;
  }

  /**
   * Example: Get single item with caching
   * Pattern: Detail endpoint - cache individual items with medium TTL
   */
  async getItemById(id: string): Promise<any> {
    const cacheKey = CACHE_KEYS.CATEGORY_BY_ID(id);

    try {
      const cached = await this.cacheService.get<any>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for item ${id}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache retrieval error:', error);
    }

    const item = {}; // await this.repository.findById(id);

    try {
      await this.cacheService.set(cacheKey, item, CACHE_TTL.LONG);
    } catch (error) {
      this.logger.warn('Cache set error:', error);
    }

    return item;
  }

  /**
   * Example: Create with cache invalidation
   * Pattern: Mutation endpoint - invalidate related caches
   */
  async createItem(data: any): Promise<any> {
    // Create in database
    const item = {}; // await this.repository.create(data);

    // Invalidate list cache
    try {
      await this.cacheService.del(CACHE_KEYS.CATEGORY_ALL);
      this.logger.debug('Invalidated all items cache');
    } catch (error) {
      this.logger.warn('Cache invalidation error:', error);
    }

    return item;
  }

  /**
   * Example: Update with cache invalidation
   * Pattern: Mutation endpoint - invalidate specific item cache
   */
  async updateItem(id: string, data: any): Promise<any> {
    // Update in database
    const item = {}; // await this.repository.update(id, data);

    // Invalidate specific caches
    try {
      await this.cacheInvalidationService.invalidateCategoryCache(id);
      this.logger.debug(`Invalidated cache for item ${id}`);
    } catch (error) {
      this.logger.warn('Cache invalidation error:', error);
    }

    return item;
  }

  /**
   * Example: Delete with cache invalidation
   * Pattern: Mutation endpoint - invalidate all related caches
   */
  async deleteItem(id: string): Promise<void> {
    // Delete from database
    // await this.repository.delete(id);

    // Invalidate related caches
    try {
      await this.cacheInvalidationService.invalidateCategoryCache(id);
      this.logger.debug(`Invalidated cache for item ${id}`);
    } catch (error) {
      this.logger.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Example: Search with caching
   * Pattern: Search endpoint - use shorter TTL for dynamic content
   */
  async searchItems(query: string): Promise<any[]> {
    const cacheKey = CACHE_KEYS.SEARCH_RESULTS(query);

    try {
      const cached = await this.cacheService.get<any[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for search: ${query}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache retrieval error:', error);
    }

    const results = []; // await this.repository.search(query);

    // Use shorter TTL for search results (more dynamic)
    try {
      await this.cacheService.set(cacheKey, results, CACHE_TTL.SHORT);
    } catch (error) {
      this.logger.warn('Cache set error:', error);
    }

    return results;
  }

  /**
   * Example: Using getOrSet utility
   * Pattern: Simplified caching pattern
   */
  async getStatistics(categoryId: string): Promise<any> {
    const cacheKey = CACHE_KEYS.CATEGORY_STATS(categoryId);

    try {
      return await this.cacheService.getOrSet(
        cacheKey,
        () => this.computeStatistics(categoryId),
        CACHE_TTL.MEDIUM,
      );
    } catch (error) {
      this.logger.warn('Cache error:', error);
      return await this.computeStatistics(categoryId);
    }
  }

  /**
   * Example: Compute expensive operation
   */
  private async computeStatistics(categoryId: string): Promise<any> {
    // This would be an expensive operation
    // const stats = await this.repository.getStatistics(categoryId);
    const stats = { count: 0, avgRating: 0 };
    return stats;
  }

  /**
   * Example: Manual cache management
   * Pattern: Admin operations - clear specific caches
   */
  async refreshAllCaches(): Promise<void> {
    try {
      await this.cacheService.reset();
      this.logger.log('All caches cleared');
    } catch (error) {
      this.logger.error('Error clearing caches:', error);
    }
  }

  /**
   * Example: Cache with complex keys
   * Pattern: Multi-parameter cache keys
   */
  async getFilteredItems(categoryId: string, status: string): Promise<any[]> {
    const cacheKey = this.cacheService.generateKey(
      'items',
      'filtered',
      categoryId,
      status,
    );

    try {
      const cached = await this.cacheService.get<any[]>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      this.logger.warn('Cache retrieval error:', error);
    }

    const items = []; // await this.repository.findFiltered(categoryId, status);

    try {
      await this.cacheService.set(cacheKey, items, CACHE_TTL.MEDIUM);
    } catch (error) {
      this.logger.warn('Cache set error:', error);
    }

    return items;
  }
}
