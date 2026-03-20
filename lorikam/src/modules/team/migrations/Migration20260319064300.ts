import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260319064300 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "team" drop constraint if exists "team_handle_unique";`);
    this.addSql(`create table if not exists "team" ("id" text not null, "name" text not null, "handle" text not null, "logo" text null, "primary_color" text null, "secondary_color" text null, "description" text null, "banner_image" text null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "team_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_team_handle_unique" ON "team" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_team_deleted_at" ON "team" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "team" cascade;`);
  }

}
