import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationEventType {
  SCHEDULE_COMPLETION_FOLLOWUP = 'schedule_completion_followup',
}

export enum NotificationEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEB_PUSH = 'web_push',
}

@Entity('notification_events')
@Index('idx_notification_event_user', ['userId'])
@Index('idx_notification_event_schedule', ['scheduleId'])
@Index('idx_notification_event_type_status', ['type', 'status'])
@Index('idx_notification_event_dedup_key', ['dedupKey'], { unique: true })
export class NotificationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  scheduleId: string | null;

  @Column({ type: 'varchar', length: 100 })
  type: NotificationEventType;

  @Column({ type: 'varchar', length: 20, default: NotificationEventStatus.PENDING })
  status: NotificationEventStatus;

  @Column({ type: 'varchar', length: 255 })
  dedupKey: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'varchar', array: true, default: () => 'ARRAY[]::varchar[]' })
  channels: NotificationChannel[];

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
