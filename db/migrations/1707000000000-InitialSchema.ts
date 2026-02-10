import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1707000000000 implements MigrationInterface {
  name = 'InitialSchema1707000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration file is a template for future schema changes
    // The initial schema is loaded from db/schema.sql
    // Run initial schema with: mysql -u root -p < db/schema.sql

    // Example migration:
    // await queryRunner.query(`ALTER TABLE categories ADD COLUMN new_column VARCHAR(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback changes here if needed
  }
}
