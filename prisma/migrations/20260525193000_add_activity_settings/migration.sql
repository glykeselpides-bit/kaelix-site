CREATE TABLE "activity_settings" (
  "id" SERIAL PRIMARY KEY,
  "guild_id" BIGINT NOT NULL,
  "activity_key" VARCHAR(80) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "reward_points" INTEGER NOT NULL DEFAULT 0,
  "cooldown_seconds" INTEGER NOT NULL DEFAULT 0,
  "channel_id" BIGINT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "uq_activity_settings_guild_activity"
  ON "activity_settings" ("guild_id", "activity_key");

CREATE INDEX "ix_activity_settings_activity_key"
  ON "activity_settings" ("activity_key");

CREATE INDEX "ix_activity_settings_guild_id"
  ON "activity_settings" ("guild_id");
