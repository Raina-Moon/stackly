import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Column as BoardColumn } from './column.entity';
import { Card } from './card.entity';
import { BoardMember } from './board-member.entity';

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color: string; // Hex color for board theme

  @Column({ type: 'boolean', default: false })
  isTemplate: boolean; // For board templates

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'varchar', length: 36, unique: true })
  @Index('idx_board_invite_code')
  inviteCode: string;

  @Column({ type: 'boolean', default: true })
  isPrivate: boolean;

  @Column({ type: 'uuid' })
  @Index('idx_board_owner')
  ownerId: string;

  @ManyToOne(() => User, (user) => user.ownedBoards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relations
  @OneToMany(() => BoardColumn, (column) => column.board, { cascade: true })
  columns: BoardColumn[];

  @OneToMany(() => Card, (card) => card.board)
  cards: Card[];

  @OneToMany(() => BoardMember, (member) => member.board, { cascade: true })
  members: BoardMember[];
}
