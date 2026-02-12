import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Get or set - if key exists, return it; otherwise set and return
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    await Promise.all(
      this.cacheManager.stores.map((store: any) =>
        store.reset ? store.reset() : Promise.resolve(),
      ),
    );
  }

  /**
   * Delete multiple keys at once
   */
  async delMultiple(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.del(key)));
  }

  /**
   * Generate a cache key with prefix
   */
  generateKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}
