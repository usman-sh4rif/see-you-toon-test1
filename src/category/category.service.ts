import { Injectable, Logger } from '@nestjs/common';
import { InMemoryCategoryRepository } from './repository/in-memory-category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ContentService } from '../content/content.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  // simple list of SSE response objects will be managed by controller via callbacks
  private sseEmitters: Array<(data: any) => void> = [];

  constructor(private repo: InMemoryCategoryRepository, private contentService: ContentService) {}

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
    const items = await this.repo.findAll();
    // update content counts from ContentService
    for (const it of items) {
      it.contentCount = this.contentService.countByCategory(it.id);
    }
    return items;
  }

  async get(id: string) {
    const it = await this.repo.findById(id);
    if (!it) return null;
    it.contentCount = this.contentService.countByCategory(it.id);
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
    this.notifyAll({ type: 'deleted', categoryId: id, reassignedTo: targetId, moved });
    return { success: true, moved, reassignedTo: targetId };
  }

  async enable(id: string) {
    const cur = await this.repo.update(id, { active: true });
    if (cur) this.notifyAll({ type: 'enabled', category: cur });
    return cur;
  }

  async disable(id: string) {
    const cur = await this.repo.update(id, { active: false });
    if (cur) this.notifyAll({ type: 'disabled', category: cur });
    return cur;
  }

  async reorder(idOrder: string[]) {
    const list = await this.repo.reorder(idOrder);
    this.notifyAll({ type: 'reordered', order: idOrder, categories: list });
    return list;
  }

  async bulkToggle(ids: string[], active: boolean) {
    const updated = await this.repo.bulkUpdate(ids, { active });
    this.notifyAll({ type: 'bulk-toggle', active, categories: updated });
    return updated;
  }
}
