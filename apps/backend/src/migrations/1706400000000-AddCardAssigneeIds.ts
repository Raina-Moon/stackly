import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardAssigneeIds1706400000000 implements MigrationInterface {
  name = 'AddCardAssigneeIds1706400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" ADD "assigneeIds" uuid[] NOT NULL DEFAULT ARRAY[]::uuid[]`,
    );

    await queryRunner.query(
      `UPDATE "cards" SET "assigneeIds" = CASE WHEN "assigneeId" IS NULL THEN ARRAY[]::uuid[] ELSE ARRAY["assigneeId"] END`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" DROP COLUMN "assigneeIds"`,
    );
  }
}
