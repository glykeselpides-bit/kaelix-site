CREATE TABLE "onboarding_settings" (
  "id" SERIAL PRIMARY KEY,
  "guild_id" BIGINT NOT NULL,
  "onboarding_enabled" BOOLEAN NOT NULL DEFAULT true,
  "welcome_channel_id" VARCHAR(32),
  "result_channel_id" VARCHAR(32),
  "allow_retakes" BOOLEAN NOT NULL DEFAULT false,
  "show_result_publicly" BOOLEAN NOT NULL DEFAULT true,
  "auto_assign_faction_role" BOOLEAN NOT NULL DEFAULT true,
  "onboarding_title" VARCHAR(200),
  "onboarding_body" TEXT,
  "quiz_enabled" BOOLEAN NOT NULL DEFAULT true,
  "custom_factions_enabled" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "uq_onboarding_settings_guild_id"
  ON "onboarding_settings" ("guild_id");

CREATE INDEX "ix_onboarding_settings_guild_id"
  ON "onboarding_settings" ("guild_id");

INSERT INTO "onboarding_settings" (
  "guild_id",
  "onboarding_enabled",
  "welcome_channel_id",
  "allow_retakes",
  "show_result_publicly",
  "created_at",
  "updated_at"
)
SELECT
  "guild_id",
  "onboarding_enabled",
  "welcome_channel_id"::text,
  "allow_retake",
  "result_visibility" = 'public',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "guild_config"
ON CONFLICT ("guild_id") DO NOTHING;

CREATE TABLE "faction_quiz_questions" (
  "id" SERIAL PRIMARY KEY,
  "guild_id" BIGINT NOT NULL,
  "question" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ix_faction_quiz_questions_guild_position"
  ON "faction_quiz_questions" ("guild_id", "position");

CREATE INDEX "ix_faction_quiz_questions_guild_id"
  ON "faction_quiz_questions" ("guild_id");

CREATE TABLE "faction_quiz_options" (
  "id" SERIAL PRIMARY KEY,
  "question_id" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "faction_id" INTEGER,
  "weight" INTEGER NOT NULL DEFAULT 1,
  "position" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "faction_quiz_options_question_id_fkey"
    FOREIGN KEY ("question_id")
    REFERENCES "faction_quiz_questions" ("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "faction_quiz_options_faction_id_fkey"
    FOREIGN KEY ("faction_id")
    REFERENCES "factions" ("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION
);

CREATE INDEX "ix_faction_quiz_options_faction_id"
  ON "faction_quiz_options" ("faction_id");

CREATE INDEX "ix_faction_quiz_options_question_position"
  ON "faction_quiz_options" ("question_id", "position");

CREATE INDEX "ix_faction_quiz_options_question_id"
  ON "faction_quiz_options" ("question_id");
