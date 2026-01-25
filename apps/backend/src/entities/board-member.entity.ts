import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Board } from './board.entity';

export enum BoardRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity('board_members')
@Unique('unique_board_user', ['boardId', 'userId'])
@Index('idx_board_members_board', ['boardId'])
@Index('idx_board_members_user', ['userId'])
export class BoardMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  boardId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: BoardRole,
    default: BoardRole.MEMBER,
  })
  role: BoardRole;

  @Column({ type: 'boolean', default: true })
  canEdit: boolean;

  @Column({ type: 'boolean', default: true })
  canComment: boolean;

  @Column({ type: 'boolean', default: false })
  isFavorite: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  joinedAt: Date;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @ManyToOne(() => User, (user) => user.boardMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
