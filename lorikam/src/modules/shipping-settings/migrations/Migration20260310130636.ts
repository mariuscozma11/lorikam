import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260310130636 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "shipping_settings" ("id" text not null, "free_shipping_threshold" numeric not null default 0, "is_free_shipping_enabled" boolean not null default false, "raw_free_shipping_threshold" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shipping_settings_deleted_at" ON "shipping_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shipping_settings" cascade;`);
  }

}
