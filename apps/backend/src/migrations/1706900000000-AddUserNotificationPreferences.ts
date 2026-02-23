import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNotificationPreferences1706900000000 implements MigrationInterface {
  name = 'AddUserNotificationPreferences1706900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notificationPreferences" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "notificationPreferences"`,
    );
  }
}
