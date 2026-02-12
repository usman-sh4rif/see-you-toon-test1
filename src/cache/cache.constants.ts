/**
 * Cache key constants and TTL values
 */

export const CACHE_KEYS = {
  // Category
  CATEGORY_ALL: 'categories:all',
  CATEGORY_BY_ID: (id: string | number) => `category:${id}`,
  CATEGORY_BY_NAME: (name: string) => `category:name:${name}`,
  CATEGORY_STATS: (id: string | number) => `category:stats:${id}`,
  CATEGORY_TAGS: (id: string | number) => `category:tags:${id}`,

  // Content
  CONTENT_ALL: 'content:all',
  CONTENT_BY_ID: (id: string | number) => `content:${id}`,
  CONTENT_BY_CATEGORY: (categoryId: string | number) =>
    `content:category:${categoryId}`,

  // General
  SEARCH_RESULTS: (query: string) => `search:${query}`,
  STATS: 'stats',
};

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  EXTRA_LONG: 86400, // 24 hours
};
