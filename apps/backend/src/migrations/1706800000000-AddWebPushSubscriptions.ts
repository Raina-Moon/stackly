import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebPushSubscriptions1706800000000 implements MigrationInterface {
  name = 'AddWebPushSubscriptions1706800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "web_push_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "endpoint" text NOT NULL,
        "p256dh" varchar(500) NOT NULL,
        "auth" varchar(500) NOT NULL,
        "expirationTime" bigint,
        "userAgent" varchar(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "lastUsedAt" timestamp,
        "lastSuccessAt" timestamp,
        "lastFailureAt" timestamp,
        "lastErrorMessage" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_web_push_subscriptions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_web_push_subscription_endpoint" ON "web_push_subscriptions" ("endpoint")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_web_push_subscription_user" ON "web_push_subscriptions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_web_push_subscription_user_active" ON "web_push_subscriptions" ("userId", "isActive")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_web_push_subscription_user_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_web_push_subscription_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_web_push_subscription_endpoint"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "web_push_subscriptions"`);
  }
}
