import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260310160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "customer_discount" ("id" text not null, "customer_id" text not null, "discount_percentage" numeric not null default 0, "is_active" boolean not null default true, "notes" text null, "raw_discount_percentage" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customer_discount_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_discount_customer_id" ON "customer_discount" ("customer_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_customer_discount_deleted_at" ON "customer_discount" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "customer_discount" cascade;`)
  }
}
