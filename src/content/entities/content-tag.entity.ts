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
import { Content } from './content.entity';
import { randomUUID } from 'crypto';

@Entity('content_tags')
@Index(['contentId', 'tagName'], { unique: true })
export class ContentTag {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  contentId: string;

  @Column('varchar', { length: 100, name: 'tag_name' })
  tagName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Content, (content) => content.tags, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
