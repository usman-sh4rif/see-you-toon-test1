import { Category } from '../entities/category.entity';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'categories.json');

// using uuidv4 imported above

export class InMemoryCategoryRepository {
  private items: Category[] = [];

  constructor() {
    this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        this.items = [];
        this.save();
        return;
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '[]');
      this.items = parsed.map((p: any) => {
        const c = new Category();
        Object.assign(c, p);
        return c;
      });
    } catch (err) {
      this.items = [];
    }
  }

  private save() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.items, null, 2), 'utf-8');
    } catch (err) {
      // ignore
    }
  }

  findAll() {
    return this.items.slice().sort((a, b) => a.position - b.position);
  }

  findById(id: string) {
    return this.items.find((i) => i.id === id) || null;
  }

  create(partial: Partial<Category>) {
    const now = new Date();
    const id = randomUUID();
    const position = this.items.length > 0 ? Math.max(...this.items.map((i) => i.position)) + 1 : 1;
    const ent = new Category();
    Object.assign(ent, {
      id,
      name: partial.name || 'Untitled',
      description: partial.description || '',
      iconUrl: partial.iconUrl || '',
      active: partial.active !== undefined ? partial.active : true,
      position,
      createdAt: now,
      updatedAt: now,
      contentCount: 0,
    });
    this.items.push(ent);
    this.save();
    return ent;
  }

  update(id: string, patch: Partial<Category>) {
    const cur = this.findById(id);
    if (!cur) return null;
    Object.assign(cur, patch);
    cur.updatedAt = new Date();
    this.save();
    return cur;
  }

  delete(id: string) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    // reset positions to contiguous sequence
    this.items = this.items
      .sort((a, b) => a.position - b.position)
      .map((c, idx) => ({ ...c, position: idx + 1 } as Category));
    this.save();
    return true;
  }

  reorder(idOrder: string[]) {
    const map = new Map(this.items.map((i) => [i.id, i]));
    const reordered: Category[] = [];
    let pos = 1;
    for (const id of idOrder) {
      const it = map.get(id);
      if (it) {
        it.position = pos++;
        reordered.push(it);
        map.delete(id);
      }
    }
    // append remaining
    for (const it of Array.from(map.values()).sort((a, b) => a.position - b.position)) {
      it.position = pos++;
      reordered.push(it);
    }
    this.items = reordered;
    this.save();
    return this.findAll();
  }

  setContentCount(id: string, count: number) {
    const it = this.findById(id);
    if (!it) return null;
    it.contentCount = count;
    this.save();
    return it;
  }

  bulkUpdate(ids: string[], patch: Partial<Category>) {
    const updated: Category[] = [];
    for (const id of ids) {
      const it = this.findById(id);
      if (it) {
        Object.assign(it, patch);
        it.updatedAt = new Date();
        updated.push(it);
      }
    }
    this.save();
    return updated;
  }
}
