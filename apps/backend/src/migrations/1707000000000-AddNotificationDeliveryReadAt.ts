import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationDeliveryReadAt1707000000000 implements MigrationInterface {
  name = 'AddNotificationDeliveryReadAt1707000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_deliveries" ADD COLUMN IF NOT EXISTS "readAt" timestamp`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_delivery_user_read_at" ON "notification_deliveries" ("userId", "readAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_delivery_user_read_at"`);
    await queryRunner.query(
      `ALTER TABLE "notification_deliveries" DROP COLUMN IF EXISTS "readAt"`,
    );
  }
}
