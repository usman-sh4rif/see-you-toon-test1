import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_KEYS } from './cache.constants';

/**
 * Service to handle cache invalidation patterns
 * Useful for invalidating related cached data when updates occur
 */
@Injectable()
export class CacheInvalidationService {
  constructor(private cacheService: CacheService) {}

  /**
   * Invalidate all category-related caches
   */
  async invalidateCategoryCache(categoryId?: string | number): Promise<void> {
    const keysToInvalidate: string[] = [CACHE_KEYS.CATEGORY_ALL];

    if (categoryId) {
      keysToInvalidate.push(
        CACHE_KEYS.CATEGORY_BY_ID(categoryId),
        CACHE_KEYS.CATEGORY_STATS(categoryId),
        CACHE_KEYS.CATEGORY_TAGS(categoryId),
      );
    }

    await this.cacheService.delMultiple(keysToInvalidate);
  }

  /**
   * Invalidate all content-related caches
   */
  async invalidateContentCache(
    contentId?: string | number,
    categoryId?: string | number,
  ): Promise<void> {
    const keysToInvalidate: string[] = [CACHE_KEYS.CONTENT_ALL];

    if (contentId) {
      keysToInvalidate.push(CACHE_KEYS.CONTENT_BY_ID(contentId));
    }

    if (categoryId) {
      keysToInvalidate.push(CACHE_KEYS.CONTENT_BY_CATEGORY(categoryId));
    }

    await this.cacheService.delMultiple(keysToInvalidate);
  }

  /**
   * Invalidate search-related caches
   */
  async invalidateSearchCache(query?: string): Promise<void> {
    if (query) {
      await this.cacheService.del(CACHE_KEYS.SEARCH_RESULTS(query));
    }
  }

  /**
   * Clear entire cache (use with caution)
   */
  async clearAllCache(): Promise<void> {
    await this.cacheService.reset();
  }
}
