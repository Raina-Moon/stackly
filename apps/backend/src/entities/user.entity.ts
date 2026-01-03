import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Board } from './board.entity';
import { Card } from './card.entity';
import { Schedule } from './schedule.entity';
import { RecurringSchedule } from './recurring-schedule.entity';
import { BoardMember } from './board-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_user_email')
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string; // Should be hashed (bcrypt)

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_user_nickname')
  nickname: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string; // URL to avatar image

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relations
  @OneToMany(() => Board, (board) => board.owner)
  ownedBoards: Board[];

  @OneToMany(() => BoardMember, (boardMember) => boardMember.user)
  boardMemberships: BoardMember[];

  @OneToMany(() => Card, (card) => card.assignee)
  assignedCards: Card[];

  @OneToMany(() => Schedule, (schedule) => schedule.user)
  schedules: Schedule[];

  @OneToMany(() => RecurringSchedule, (recurring) => recurring.user)
  recurringSchedules: RecurringSchedule[];
}
