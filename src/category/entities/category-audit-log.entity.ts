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

@Entity('category_audit_log')
@Index(['categoryId'])
@Index(['changedAt'])
@Index(['action'])
export class CategoryAuditLog {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  categoryId: string;

  @Column('varchar', { length: 50 })
  action: string; // created, updated, deleted, enabled, disabled

  @Column('json', { nullable: true })
  oldValues: Record<string, any>;

  @Column('json', { nullable: true })
  newValues: Record<string, any>;

  @Column('varchar', { length: 100, nullable: true, name: 'changed_by' })
  changedBy: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;

  @ManyToOne(() => Category, (category) => category.auditLogs, {
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
