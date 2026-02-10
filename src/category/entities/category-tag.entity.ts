import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Category } from './category.entity';
import { randomUUID } from 'crypto';

@Entity('category_tags')
@Index(['categoryId', 'tagName'], { unique: true })
export class CategoryTag {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  categoryId: string;

  @Column('varchar', { length: 100, name: 'tag_name' })
  tagName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.tags, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
