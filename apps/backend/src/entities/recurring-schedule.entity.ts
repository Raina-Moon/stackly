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

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Entity('recurring_schedules')
@Index('idx_recurring_schedule_user', ['userId'])
export class RecurringSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RecurrenceFrequency,
  })
  frequency: RecurrenceFrequency;

  @Column({ type: 'int', default: 1 })
  interval: number; // e.g., every 2 weeks = interval: 2, frequency: WEEKLY

  @Column({ type: 'simple-array', nullable: true })
  daysOfWeek: number[]; // [0-6] for WEEKLY, DayOfWeek enum values

  @Column({ type: 'int', nullable: true })
  dayOfMonth: number; // 1-31 for MONTHLY

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date; // null = repeats indefinitely

  @Column({ type: 'int', nullable: true })
  occurrences: number; // Alternative to endDate

  @Column({ type: 'time' })
  startTime: string; // HH:MM:SS format

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'int', default: 0 })
  duration: number; // Duration in minutes

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'simple-array', nullable: true })
  excludedDates: string[]; // ISO date strings for exceptions

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.recurringSchedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
