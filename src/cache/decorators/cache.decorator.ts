import {
  applyDecorators,
  Inject,
  UseInterceptors,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { CacheService } from '../cache.service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

/**
 * Custom interceptor for caching method results
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = request.url;

    return from(this.cacheService.get(cacheKey)).pipe(
      switchMap((cachedData) => {
        if (cachedData) {
          return of(cachedData);
        }
        return next.handle().pipe(
          tap((data) => {
            this.cacheService.set(cacheKey, data, 3600); // 1 hour default
          }),
        );
      }),
    );
  }
}

/**
 * Decorator to cache method results
 * Usage: @Cacheable({ ttl: 3600, keyPrefix: 'users' })
 */
export function Cacheable(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const ttl = options.ttl || 3600;
    const keyPrefix = options.keyPrefix || propertyKey;

    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService as CacheService;

      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      // Generate cache key from method name and arguments
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      try {
        const cached = await cacheService.get(cacheKey);
        if (cached !== undefined) {
          return cached;
        }
      } catch (error) {
        console.warn(`Cache get error for key ${cacheKey}:`, error);
      }

      const result = await originalMethod.apply(this, args);

      try {
        await cacheService.set(cacheKey, result, ttl);
      } catch (error) {
        console.warn(`Cache set error for key ${cacheKey}:`, error);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator to invalidate cache
 * Usage: @InvalidateCache(['users:*'])
 */
export function InvalidateCache(keyPatterns: string[] = []) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService as CacheService;

      const result = await originalMethod.apply(this, args);

      if (cacheService) {
        try {
          await Promise.all(
            keyPatterns.map((pattern) => cacheService.del(pattern)),
          );
        } catch (error) {
          console.warn('Cache invalidation error:', error);
        }
      }

      return result;
    };

    return descriptor;
  };
}
