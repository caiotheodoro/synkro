import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1740697481044 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create pgcrypto extension for UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Create roles table
    await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" character varying NOT NULL,
                "permissions" json NOT NULL DEFAULT '[]',
                "description" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_roles_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_roles_name" UNIQUE ("name")
            )
        `);

    // Create users table with enum type
    await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')
        `);

    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "role" "users_role_enum" NOT NULL DEFAULT 'user',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);

    // Create user_roles junction table
    await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
                CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
