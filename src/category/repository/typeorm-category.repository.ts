import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../category/entities/category.entity';

@Injectable()
export class TypeOrmCategoryRepository {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  findAll() {
    return this.repo.find({ order: { position: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(partial: Partial<Category>) {
    const ent = this.repo.create(partial as any);
    await this.repo.save(ent);
    return ent;
  }

  async update(id: string, patch: Partial<Category>) {
    const cur = await this.findById(id);
    if (!cur) return null;
    Object.assign(cur, patch);
    await this.repo.save(cur);
    return cur;
  }

  async delete(id: string) {
    const res = await this.repo.delete(id);
    return res.affected && res.affected > 0;
  }

  async reorder(idOrder: string[]) {
    // load current items
    const items = await this.findAll();
    const map = new Map(items.map((i) => [i.id, i]));
    let pos = 1;
    for (const id of idOrder) {
      const it = map.get(id);
      if (it) {
        it.position = pos++;
        await this.repo.save(it);
        map.delete(id);
      }
    }
    for (const it of Array.from(map.values()).sort((a, b) => a.position - b.position)) {
      it.position = pos++;
      await this.repo.save(it);
    }
    return this.findAll();
  }

  async setContentCount(id: string, count: number) {
    const it = await this.findById(id);
    if (!it) return null;
    it.contentCount = count;
    await this.repo.save(it);
    return it;
  }

  async bulkUpdate(ids: string[], patch: Partial<Category>) {
    const updated: Category[] = [];
    for (const id of ids) {
      const it = await this.findById(id);
      if (it) {
        Object.assign(it, patch);
        await this.repo.save(it);
        updated.push(it);
      }
    }
    return updated;
  }
}
