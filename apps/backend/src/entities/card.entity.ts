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
import { Board } from './board.entity';
import { Column as BoardColumn } from './column.entity';
import { User } from './user.entity';
import { Schedule } from './schedule.entity';

export enum CardPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('cards')
@Index('idx_card_column_position', ['columnId', 'position'])
@Index('idx_card_board', ['boardId'])
@Index('idx_card_assignee', ['assigneeId'])
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  position: number; // For ordering within column

  @Column({
    type: 'enum',
    enum: CardPriority,
    default: CardPriority.MEDIUM,
  })
  priority: CardPriority;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string; // Optional card color/label

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]; // Simple array of tags

  @Column({ type: 'int', default: 0 })
  estimatedHours: number; // Time estimation

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date; // Simple due date

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'uuid' })
  boardId: string;

  @Column({ type: 'uuid' })
  columnId: string;

  @Column({ type: 'uuid', nullable: true })
  assigneeId: string;

  @Column({ type: 'uuid', array: true, nullable: true, default: () => 'ARRAY[]::uuid[]' })
  assigneeIds: string[];

  @ManyToOne(() => Board, (board) => board.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @ManyToOne(() => BoardColumn, (column) => column.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column: BoardColumn;

  @ManyToOne(() => User, (user) => user.assignedCards, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relations
  @OneToMany(() => Schedule, (schedule) => schedule.card)
  schedules: Schedule[];
}
