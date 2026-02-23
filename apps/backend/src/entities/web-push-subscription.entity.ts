import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('web_push_subscriptions')
@Index('idx_web_push_subscription_user', ['userId'])
@Index('idx_web_push_subscription_endpoint', ['endpoint'], { unique: true })
@Index('idx_web_push_subscription_user_active', ['userId', 'isActive'])
export class WebPushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'varchar', length: 500 })
  p256dh: string;

  @Column({ type: 'varchar', length: 500 })
  auth: string;

  @Column({ type: 'bigint', nullable: true })
  expirationTime: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSuccessAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastFailureAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastErrorMessage: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
