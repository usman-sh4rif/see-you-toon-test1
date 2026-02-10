import { Injectable } from '@nestjs/common';

/**
 * Minimal in-memory ContentService to simulate content counts and reassignment logic.
 * In a real system this would be a DB-backed repository.
 */
@Injectable()
export class ContentService {
  // simple map: contentId -> { id, title, categoryId }
  private contents: Record<string, any> = {};

  constructor() {
    // create some demo content for counts
    for (let i = 1; i <= 5; i++) {
      const cid = `content-${i}`;
      this.contents[cid] = { id: cid, title: `Demo ${i}`, categoryId: i % 2 === 0 ? 'demo-cat-2' : 'demo-cat-1' };
    }
  }

  countByCategory(categoryId: string) {
    return Object.values(this.contents).filter((c: any) => c.categoryId === categoryId).length;
  }

  reassignCategory(fromCategoryId: string, toCategoryId: string) {
    let moved = 0;
    for (const c of Object.values(this.contents)) {
      if (c.categoryId === fromCategoryId) {
        c.categoryId = toCategoryId;
        moved++;
      }
    }
    return moved;
  }

  getByCategory(categoryId: string) {
    return Object.values(this.contents).filter((c: any) => c.categoryId === categoryId);
  }

  createForCategory(categoryId: string, title: string) {
    const id = `content-${Object.keys(this.contents).length + 1}`;
    this.contents[id] = { id, title, categoryId };
    return this.contents[id];
  }
}
