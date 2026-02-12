import { Injectable, Logger } from '@nestjs/common';
import { InMemoryCategoryRepository } from './repository/in-memory-category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ContentService } from '../content/content.service';
import { CacheService } from '../cache/cache.service';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/cache.constants';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  // simple list of SSE response objects will be managed by controller via callbacks
  private sseEmitters: Array<(data: any) => void> = [];

  constructor(
    private repo: InMemoryCategoryRepository,
    private contentService: ContentService,
    private cacheService: CacheService,
    private cacheInvalidationService: CacheInvalidationService,
  ) {}

  subscribeSse(cb: (data: any) => void) {
    this.sseEmitters.push(cb);
    return () => {
      const idx = this.sseEmitters.indexOf(cb);
      if (idx !== -1) this.sseEmitters.splice(idx, 1);
    };
  }

  private notifyAll(payload: any) {
    for (const cb of this.sseEmitters) {
      try {
        cb(payload);
      } catch (err) {
        // ignore per-client errors
      }
    }
  }

  async list() {
    // Try to get from cache first
    const cachedItems = await this.cacheService.get(CACHE_KEYS.CATEGORY_ALL);
    if (cachedItems) {
      this.logger.debug('Cache hit for all categories');
      return cachedItems;
    }

    const items = await this.repo.findAll();
    // update content counts from ContentService
    for (const it of items) {
      it.contentCount = this.contentService.countByCategory(it.id);
    }

    // Cache the result
    await this.cacheService.set(
      CACHE_KEYS.CATEGORY_ALL,
      items,
      CACHE_TTL.LONG,
    );

    return items;
  }

  async get(id: string) {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.CATEGORY_BY_ID(id);
    const cachedItem = await this.cacheService.get(cacheKey);
    if (cachedItem) {
      this.logger.debug(`Cache hit for category ${id}`);
      return cachedItem;
    }

    const it = await this.repo.findById(id);
    if (!it) return null;
    it.contentCount = this.contentService.countByCategory(it.id);

    // Cache the result
    await this.cacheService.set(cacheKey, it, CACHE_TTL.LONG);

    return it;
  }

  async create(dto: CreateCategoryDto) {
    if (!dto || !dto.name || dto.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    const ent = await this.repo.create({
      name: dto.name.trim(),
      description: dto.description || '',
      iconUrl: dto.iconUrl || '',
      active: dto.active !== undefined ? dto.active : true,
    });
    ent.contentCount = 0;

    // Invalidate cache
    await this.cacheInvalidationService.invalidateCategoryCache();

    this.notifyAll({ type: 'created', category: ent });
    return ent;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cur = await this.repo.findById(id);
    if (!cur) return null;
    const patch: any = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.iconUrl !== undefined) patch.iconUrl = dto.iconUrl;
    if (dto.active !== undefined) patch.active = dto.active;
    const updated = await this.repo.update(id, patch);

    // Invalidate related caches
    await this.cacheInvalidationService.invalidateCategoryCache(id);

    this.notifyAll({ type: 'updated', category: updated });
    return updated;
  }

  async remove(id: string, reassignToId?: string) {
    const cur = await this.repo.findById(id);
    if (!cur) return { success: false, message: 'Not found' };

    // determine target for reassignment
    let targetId = reassignToId;
    if (!targetId) {
      // create or find an 'Uncategorized' bucket
      const existingList = await this.repo.findAll();
      const existing = existingList.find((c) => c.name === 'Uncategorized');
      if (existing) targetId = existing.id;
      else {
        const created = await this.repo.create({ name: 'Uncategorized', description: 'Auto-created' });
        targetId = created.id;
      }
    }

    // reassign content
    const moved = this.contentService.reassignCategory(id, targetId);
    // update counts
    await this.repo.setContentCount(targetId, this.contentService.countByCategory(targetId));

    const ok = await this.repo.delete(id);
    if (!ok) return { success: false, message: 'Delete failed' };

    // Invalidate related caches
    await this.cacheInvalidationService.invalidateCategoryCache(id);
    await this.cacheInvalidationService.invalidateCategoryCache(targetId);

    this.notifyAll({ type: 'deleted', categoryId: id, reassignedTo: targetId, moved });
    return { success: true, moved, reassignedTo: targetId };
  }

  async enable(id: string) {
    const cur = await this.repo.update(id, { active: true });
    if (cur) {
      // Invalidate cache
      await this.cacheInvalidationService.invalidateCategoryCache(id);
      this.notifyAll({ type: 'enabled', category: cur });
    }
    return cur;
  }

  async disable(id: string) {
    const cur = await this.repo.update(id, { active: false });
    if (cur) {
      // Invalidate cache
      await this.cacheInvalidationService.invalidateCategoryCache(id);
      this.notifyAll({ type: 'disabled', category: cur });
    }
    return cur;
  }

  async reorder(idOrder: string[]) {
    const list = await this.repo.reorder(idOrder);

    // Invalidate all category caches
    await this.cacheInvalidationService.invalidateCategoryCache();

    this.notifyAll({ type: 'reordered', order: idOrder, categories: list });
    return list;
  }

  async bulkToggle(ids: string[], active: boolean) {
    const updated = await this.repo.bulkUpdate(ids, { active });

    // Invalidate caches for all affected categories
    await Promise.all(
      ids.map((id) => this.cacheInvalidationService.invalidateCategoryCache(id)),
    );

    this.notifyAll({ type: 'bulk-toggle', active, categories: updated });
    return updated;
  }
}

