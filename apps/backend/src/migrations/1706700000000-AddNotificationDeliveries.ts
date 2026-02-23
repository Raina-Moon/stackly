import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationDeliveries1706700000000 implements MigrationInterface {
  name = 'AddNotificationDeliveries1706700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "channel" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "attemptCount" integer NOT NULL DEFAULT 0,
        "payload" jsonb,
        "providerMessageId" varchar(255),
        "lastAttemptedAt" timestamp,
        "sentAt" timestamp,
        "errorMessage" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_deliveries_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_notification_delivery_event_channel" ON "notification_deliveries" ("eventId", "channel")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_delivery_event" ON "notification_deliveries" ("eventId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_delivery_status_channel" ON "notification_deliveries" ("status", "channel")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_delivery_user" ON "notification_deliveries" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_delivery_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_delivery_status_channel"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_delivery_event"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_delivery_event_channel"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_deliveries"`);
  }
}
