import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScheduleStatus1706500000000 implements MigrationInterface {
  name = 'AddScheduleStatus1706500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP COLUMN IF EXISTS "status"`,
    );
  }
}
