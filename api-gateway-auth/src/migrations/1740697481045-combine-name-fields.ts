import { MigrationInterface, QueryRunner } from 'typeorm';

export class CombineNameFields1740697481045 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add name column
    await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying`);

    // Update name column with combined firstName and lastName
    await queryRunner.query(`
      UPDATE "users" 
      SET "name" = CASE
        WHEN "firstName" IS NOT NULL AND "lastName" IS NOT NULL THEN "firstName" || ' ' || "lastName"
        WHEN "firstName" IS NOT NULL THEN "firstName"
        WHEN "lastName" IS NOT NULL THEN "lastName"
        ELSE NULL
      END
    `);

    // Drop firstName and lastName columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add firstName and lastName columns
    await queryRunner.query(
      `ALTER TABLE "users" ADD "firstName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastName" character varying`,
    );

    // Update firstName and lastName from name
    await queryRunner.query(`
      UPDATE "users" 
      SET 
        "firstName" = SPLIT_PART("name", ' ', 1),
        "lastName" = CASE
          WHEN POSITION(' ' IN "name") > 0 THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
          ELSE NULL
        END
      WHERE "name" IS NOT NULL
    `);

    // Drop name column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}
