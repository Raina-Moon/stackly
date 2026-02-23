import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsFavoriteToMember1706300000000 implements MigrationInterface {
  name = 'AddIsFavoriteToMember1706300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "board_members" ADD COLUMN IF NOT EXISTS "isFavorite" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "board_members" DROP COLUMN "isFavorite"`,
    );
  }
}
