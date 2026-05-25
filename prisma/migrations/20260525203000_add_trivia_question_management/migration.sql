ALTER TABLE "trivia_questions"
  ADD COLUMN "guild_id" BIGINT,
  ADD COLUMN "reward_points" INTEGER,
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ix_trivia_questions_guild_id"
  ON "trivia_questions" ("guild_id");

CREATE INDEX "ix_trivia_questions_guild_active"
  ON "trivia_questions" ("guild_id", "is_active");
