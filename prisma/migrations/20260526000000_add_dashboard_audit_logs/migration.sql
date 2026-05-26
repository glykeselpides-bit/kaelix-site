CREATE TABLE "dashboard_audit_logs" (
  "id" SERIAL PRIMARY KEY,
  "guild_id" BIGINT NOT NULL,
  "user_id" BIGINT,
  "action_type" VARCHAR(50) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" VARCHAR(100),
  "summary" VARCHAR(500) NOT NULL,
  "metadata" JSON,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ix_dashboard_audit_logs_guild_created"
  ON "dashboard_audit_logs" ("guild_id", "created_at");

CREATE INDEX "ix_dashboard_audit_logs_guild_action"
  ON "dashboard_audit_logs" ("guild_id", "action_type");

CREATE INDEX "ix_dashboard_audit_logs_guild_entity"
  ON "dashboard_audit_logs" ("guild_id", "entity_type");

CREATE INDEX "ix_dashboard_audit_logs_user_id"
  ON "dashboard_audit_logs" ("user_id");
