import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationEventsAndScheduleFollowup1706600000000 implements MigrationInterface {
  name = 'AddNotificationEventsAndScheduleFollowup1706600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "scheduleId" uuid,
        "type" varchar(100) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "dedupKey" varchar(255) NOT NULL,
        "payload" jsonb,
        "channels" varchar[] NOT NULL DEFAULT ARRAY[]::varchar[],
        "processedAt" timestamp,
        "errorMessage" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_notification_event_dedup_key" ON "notification_events" ("dedupKey")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_event_user" ON "notification_events" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_event_schedule" ON "notification_events" ("scheduleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_event_type_status" ON "notification_events" ("type", "status")`,
    );

    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "completionFollowupNotifiedAt" timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "completionFollowupNotificationEventId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP COLUMN IF EXISTS "completionFollowupNotificationEventId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP COLUMN IF EXISTS "completionFollowupNotifiedAt"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_event_type_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_event_schedule"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_event_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_event_dedup_key"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_events"`);
  }
}
