import { NextResponse } from "next/server";
import {
  formatDate,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type SessionConfig = {
  activityKey: string;
  label: string;
  modelName: keyof ReturnType<typeof getPrisma>;
  endedField?: "ended_at" | "ends_at";
  statusField?: string;
  endStatus?: string;
};

type SessionRow = {
  id: number;
  is_active: boolean;
  started_at: Date;
  ended_at?: Date | null;
  ends_at?: Date | null;
  status?: string | null;
};

const SESSION_CONFIGS: SessionConfig[] = [
  {
    activityKey: "caption_this",
    label: "Caption This",
    modelName: "caption_this_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "cipher",
    label: "Cipher",
    modelName: "cipher_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "emoji_race",
    label: "Emoji Race",
    modelName: "emoji_race_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "gif_battle",
    label: "GIF Battle",
    modelName: "gif_battle_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "hidden_word",
    label: "Hidden Word",
    modelName: "hidden_word_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "hot_takes",
    label: "Hot Takes",
    modelName: "hot_takes_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "mcq",
    label: "Multiple Choice",
    modelName: "mcq_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "meme_war",
    label: "Meme War",
    modelName: "meme_war_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "puzzle_drop",
    label: "Puzzle Drop",
    modelName: "puzzle_drop_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "reflex",
    label: "Reflex",
    modelName: "reflex_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "riddle",
    label: "Riddle",
    modelName: "riddle_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "speed_typing",
    label: "Speed Typing",
    modelName: "speed_typing_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "story_chain",
    label: "Story Chain",
    modelName: "story_chain_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "trivia",
    label: "Trivia",
    modelName: "trivia_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "two_truths_lie",
    label: "Two Truths and a Lie",
    modelName: "two_truths_lie_sessions",
    endedField: "ended_at",
  },
  {
    activityKey: "would_you_rather",
    label: "Would You Rather",
    modelName: "wyr_sessions",
    endedField: "ends_at",
  },
];

const SESSION_CONFIG_BY_KEY = new Map(
  SESSION_CONFIGS.map((config) => [config.activityKey, config])
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getDelegate(
  prisma: ReturnType<typeof getPrisma>,
  modelName: keyof ReturnType<typeof getPrisma>
) {
  const delegate = prisma[modelName];

  if (
    !delegate ||
    typeof delegate !== "object" ||
    !("findMany" in delegate) ||
    !("findFirst" in delegate) ||
    !("updateMany" in delegate)
  ) {
    throw new Error(`Unsupported activity session model: ${String(modelName)}`);
  }

  return delegate as {
    findMany: (args: unknown) => Promise<SessionRow[]>;
    findFirst: (args: unknown) => Promise<SessionRow | null>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
  };
}

function isKnownMissingTableError(error: unknown) {
  if (!isRecord(error)) {
    return false;
  }

  const message =
    typeof error.message === "string" ? error.message.toLowerCase() : "";
  const meta = isRecord(error.meta) ? error.meta : {};
  const cause = typeof meta.cause === "string" ? meta.cause.toLowerCase() : "";
  const code = typeof error.code === "string" ? error.code : "";

  return (
    code === "P2021" ||
    message.includes("does not exist") ||
    cause.includes("does not exist")
  );
}

function getEndedAt(row: SessionRow, config: SessionConfig) {
  return config.endedField === "ends_at" ? row.ends_at : row.ended_at;
}

function toSessionResponse(row: SessionRow, config: SessionConfig) {
  const endedAt = getEndedAt(row, config);
  const canEnd = Boolean(config.endedField);
  const isActive = Boolean(row.is_active);

  return {
    id: row.id,
    activityKey: config.activityKey,
    type: config.label,
    status: row.status ?? (isActive ? "Active" : "Ended"),
    isActive,
    startedAt: formatDate(row.started_at),
    endedAt: formatDate(endedAt ?? null),
    canEnd: canEnd && isActive,
    endDisabledReason: canEnd
      ? null
      : "Manual cleanup required",
  };
}

async function getSessionsForConfig(
  prisma: ReturnType<typeof getPrisma>,
  guildIdBigInt: bigint,
  config: SessionConfig
) {
  try {
    const delegate = getDelegate(prisma, config.modelName);
    const select = {
      id: true,
      is_active: true,
      started_at: true,
      ...(config.endedField ? { [config.endedField]: true } : {}),
      ...(config.statusField ? { [config.statusField]: true } : {}),
    };
    const [active, recent] = await Promise.all([
      delegate.findMany({
        where: { guild_id: guildIdBigInt, is_active: true },
        orderBy: { started_at: "desc" },
        take: 20,
        select,
      }),
      delegate.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: { started_at: "desc" },
        take: 5,
        select,
      }),
    ]);

    return {
      active: active.map((row) => toSessionResponse(row, config)),
      recent: recent.map((row) => toSessionResponse(row, config)),
    };
  } catch (error) {
    console.error("Failed to load activity sessions", {
      activityKey: config.activityKey,
      modelName: config.modelName,
      missingTable: isKnownMissingTableError(error),
      error,
    });

    return { active: [], recent: [] };
  }
}

async function getSessionsPayload(guildIdBigInt: bigint) {
  const prisma = getPrisma();
  const results = await Promise.all(
    SESSION_CONFIGS.map((config) =>
      getSessionsForConfig(prisma, guildIdBigInt, config)
    )
  );
  const activeSessions = results
    .flatMap((result) => result.active)
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
  const recentSessions = results
    .flatMap((result) => result.recent)
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))
    .slice(0, 20);

  return {
    activeSessions,
    recentSessions,
    sessions: activeSessions,
  };
}

function validateEndSessionBody(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const action = typeof body.action === "string" ? body.action : "end";

  if (action !== "end") {
    return { error: "Unsupported activity session action." };
  }

  if (
    typeof body.activityKey !== "string" ||
    !SESSION_CONFIG_BY_KEY.has(body.activityKey)
  ) {
    return { error: "activityKey is not supported." };
  }

  if (
    typeof body.sessionId !== "number" ||
    !Number.isInteger(body.sessionId) ||
    body.sessionId <= 0
  ) {
    return { error: "sessionId must be a positive integer." };
  }

  return {
    activityKey: body.activityKey,
    sessionId: body.sessionId,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return invalidGuildIdResponse();
  }

  try {
    return NextResponse.json(await getSessionsPayload(guildIdBigInt));
  } catch (error) {
    console.error("Failed to load server activity sessions", {
      guildId,
      error,
    });

    return NextResponse.json({
      activeSessions: [],
      recentSessions: [],
      sessions: [],
      warnings: ["Activity sessions could not be loaded."],
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return invalidGuildIdResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const validation = validateEndSessionBody(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  const config = SESSION_CONFIG_BY_KEY.get(validation.activityKey);

  if (!config || !config.endedField) {
    return NextResponse.json(
      {
        error: "This activity session table cannot be ended safely.",
        endDisabledReason: "Manual cleanup required",
      },
      { status: 409 }
    );
  }

  try {
    const prisma = getPrisma();
    const delegate = getDelegate(prisma, config.modelName);
    const existingSession = await delegate.findFirst({
      where: {
        id: validation.sessionId,
        guild_id: guildIdBigInt,
      },
      select: {
        id: true,
        is_active: true,
        started_at: true,
        [config.endedField]: true,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Activity session was not found for this server." },
        { status: 404 }
      );
    }

    if (!existingSession.is_active) {
      return NextResponse.json({
        ended: false,
        message: "Activity session is already ended.",
        ...(await getSessionsPayload(guildIdBigInt)),
      });
    }

    const now = new Date();
    const data: Record<string, unknown> = {
      is_active: false,
      [config.endedField]: now,
    };

    if (config.statusField && config.endStatus) {
      data[config.statusField] = config.endStatus;
    }

    const result = await delegate.updateMany({
      where: {
        id: validation.sessionId,
        guild_id: guildIdBigInt,
      },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Activity session could not be ended." },
        { status: 409 }
      );
    }

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType: "END_SESSION",
      entityType: "ACTIVITY",
      entityId: `${validation.activityKey}:${validation.sessionId}`,
      summary: `Ended ${config.label} session #${validation.sessionId}`,
      metadata: {
        activityKey: validation.activityKey,
        sessionId: validation.sessionId,
        endedAt: now,
      },
    });

    return NextResponse.json({
      ended: true,
      endedAt: formatDate(now),
      ...(await getSessionsPayload(guildIdBigInt)),
    });
  } catch (error) {
    console.error("Failed to end activity session", {
      guildId,
      activityKey: validation.activityKey,
      sessionId: validation.sessionId,
      missingTable: isKnownMissingTableError(error),
      error,
    });

    return NextResponse.json(
      {
        error: "Failed to end activity session.",
        activeSessions: [],
        recentSessions: [],
        sessions: [],
      },
      { status: 500 }
    );
  }
}

export const POST = PATCH;
