import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Category } from './category.entity';
import { randomUUID } from 'crypto';

@Entity('category_stats')
@Index(['categoryId'], { unique: true })
export class CategoryStat {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36, unique: true })
  categoryId: string;

  @Column('int', { default: 0, name: 'total_views' })
  totalViews: number;

  @Column('int', { default: 0, name: 'total_interactions' })
  totalInteractions: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  @ManyToOne(() => Category, (category) => category.stats, {
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
