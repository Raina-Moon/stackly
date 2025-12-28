import {
  Entity,
  PrimaryGeneratedColumn,
  Column as TypeORMColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Board } from './board.entity';
import { Card } from './card.entity';

@Entity('columns')
@Index('idx_column_board_position', ['boardId', 'position'])
export class Column {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @TypeORMColumn({ type: 'varchar', length: 255 })
  name: string;

  @TypeORMColumn({ type: 'varchar', length: 7, default: '#6B7280' })
  color: string; // Hex color

  @TypeORMColumn({ type: 'int' })
  position: number; // For ordering columns (0-indexed)

  @TypeORMColumn({ type: 'int', default: 0 })
  wipLimit: number; // Work In Progress limit (0 = unlimited)

  @TypeORMColumn({ type: 'boolean', default: false })
  isCollapsed: boolean;

  @TypeORMColumn({ type: 'uuid' })
  @Index('idx_column_board')
  boardId: string;

  @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Card, (card) => card.column)
  cards: Card[];
}
