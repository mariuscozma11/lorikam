import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260312110000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "customer_discount" ADD COLUMN IF NOT EXISTS "is_collaborator" boolean NOT NULL DEFAULT false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "customer_discount" DROP COLUMN IF EXISTS "is_collaborator";`);
  }

}
