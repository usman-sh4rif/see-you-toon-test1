import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
} from 'typeorm';
// import { Content } from './content.entity';
// import { Content } from 'src/content/entities/content.entity';
import { Content } from '../../content/entities/content.entity';
// import { CategoryTag } from './category-tag.entity';
import { CategoryTag } from './category-tag.entity';
// import { CategoryStat } from './category-stat.entity';
import { CategoryStat } from './category-stat.entity';
// import { CategoryAuditLog } from './category-audit-log.entity';
import { CategoryAuditLog } from './category-audit-log.entity';
import { randomUUID } from 'crypto';

@Entity('categories')
@Index(['active', 'position'])
export class Category {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255, unique: true })
  name: string;

  @Column('longtext', { nullable: true })
  description: string;

  @Column('varchar', { length: 500, nullable: true, name: 'icon_url' })
  iconUrl: string;

  @Column('boolean', { default: true })
  active: boolean;

  @Column('int', { default: 0 })
  position: number;

  @Column('int', { default: 0, name: 'content_count' })
  contentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Content, (content) => content.category)
  content: Content[];

  @OneToMany(() => CategoryTag, (tag) => tag.category)
  tags: CategoryTag[];

  @OneToMany(() => CategoryStat, (stat) => stat.category)
  stats: CategoryStat[];

  @OneToMany(() => CategoryAuditLog, (log) => log.category)
  auditLogs: CategoryAuditLog[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
