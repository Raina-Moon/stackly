import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NotificationChannel, NotificationEvent } from './notification-event.entity';

export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity('notification_deliveries')
@Index('idx_notification_delivery_event', ['eventId'])
@Index('idx_notification_delivery_status_channel', ['status', 'channel'])
@Index('idx_notification_delivery_user', ['userId'])
@Index('idx_notification_delivery_event_channel', ['eventId', 'channel'], { unique: true })
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 20, default: NotificationDeliveryStatus.PENDING })
  status: NotificationDeliveryStatus;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => NotificationEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: NotificationEvent;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
