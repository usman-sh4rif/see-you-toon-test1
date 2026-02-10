import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  BeforeInsert,
} from 'typeorm';
// import { Category } from './category.entity';
import { Category } from '../../category/entities/category.entity';
// import { ContentTag } from './content-tag.entity';
import { ContentTag } from './content-tag.entity';
import { randomUUID } from 'crypto';

@Entity('content')
@Index(['categoryId', 'active'])
export class Content {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  categoryId: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('longtext', { nullable: true })
  description: string;

  @Column('varchar', { length: 500, nullable: true, name: 'thumbnail_url' })
  thumbnailUrl: string;

  @Column('varchar', { length: 500, nullable: true, name: 'content_url' })
  contentUrl: string;

  @Column('enum', { enum: ['image', 'video', 'article', 'audio', 'document'], default: 'article', name: 'content_type' })
  contentType: string;

  @Column('boolean', { default: true })
  active: boolean;

  @Column('int', { default: 0, name: 'view_count' })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.content, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => ContentTag, (tag) => tag.content)
  tags: ContentTag[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
