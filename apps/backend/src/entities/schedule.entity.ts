import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Card } from './card.entity';

export enum ScheduleType {
  EVENT = 'event',
  DEADLINE = 'deadline',
  REMINDER = 'reminder',
  MILESTONE = 'milestone',
}

@Entity('schedules')
@Index('idx_schedule_user', ['userId'])
@Index('idx_schedule_card', ['cardId'])
@Index('idx_schedule_date_range', ['startTime', 'endTime'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ScheduleType,
    default: ScheduleType.EVENT,
  })
  type: ScheduleType;

  @Column({ type: 'timestamp' })
  @Index('idx_schedule_start_time')
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'boolean', default: false })
  isAllDay: boolean;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'jsonb', nullable: true })
  reminders: {
    minutes: number;
    method: 'email' | 'notification';
  }[];

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  cardId: string;

  @ManyToOne(() => User, (user) => user.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Card, (card) => card.schedules, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'cardId' })
  card: Card;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
