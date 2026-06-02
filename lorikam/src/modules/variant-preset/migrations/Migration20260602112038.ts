import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260602112038 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "croi" drop constraint if exists "croi_label_unique";`);
    this.addSql(`create table if not exists "croi" ("id" text not null, "label" text not null, "size_preset_id" text null, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "croi_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_croi_label_unique" ON "croi" ("label") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_croi_deleted_at" ON "croi" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "size_preset" ("id" text not null, "name" text not null, "sizes" jsonb not null, "display_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "size_preset_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_size_preset_deleted_at" ON "size_preset" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "croi" cascade;`);

    this.addSql(`drop table if exists "size_preset" cascade;`);
  }

}
