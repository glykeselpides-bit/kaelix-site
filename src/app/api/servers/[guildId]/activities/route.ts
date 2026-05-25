import { NextResponse } from "next/server";
import {
  formatBigInt,
  formatDate,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type ActivityCatalogItem = {
  key: string;
  label: string;
  sessionModel: keyof ReturnType<typeof getPrisma>;
  endedField?: string;
};

type RecentSession = {
  type: string;
  activityKey: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
};

type ActivitySettingRecord = {
  activity_key: string;
  enabled: boolean;
  reward_points: number;
  cooldown_seconds: number;
  channel_id: bigint | null;
  created_at: Date;
  updated_at: Date;
};

type ActivitySessionResult = {
  activity: ActivityCatalogItem;
  active: number;
  total: number;
  recent: {
    is_active: boolean;
    started_at: Date;
    ended_at?: Date | null;
    ends_at?: Date | null;
  }[];
};

type ActivityPatch = {
  activityKey: string;
  enabled?: boolean;
  rewardPoints?: number;
  cooldownSeconds?: number;
  channelId?: string | null;
};

const ACTIVITY_CATALOG: ActivityCatalogItem[] = [
  { key: "caption_this", label: "Caption This", sessionModel: "caption_this_sessions" },
  { key: "cipher", label: "Cipher", sessionModel: "cipher_sessions" },
  { key: "emoji_race", label: "Emoji Race", sessionModel: "emoji_race_sessions" },
  { key: "gif_battle", label: "GIF Battle", sessionModel: "gif_battle_sessions" },
  { key: "hidden_word", label: "Hidden Word", sessionModel: "hidden_word_sessions" },
  { key: "hot_takes", label: "Hot Takes", sessionModel: "hot_takes_sessions" },
  { key: "mcq", label: "Multiple Choice", sessionModel: "mcq_sessions" },
  { key: "meme_war", label: "Meme War", sessionModel: "meme_war_sessions" },
  { key: "puzzle_drop", label: "Puzzle Drop", sessionModel: "puzzle_drop_sessions" },
  { key: "reflex", label: "Reflex", sessionModel: "reflex_sessions" },
  { key: "riddle", label: "Riddle", sessionModel: "riddle_sessions" },
  { key: "speed_typing", label: "Speed Typing", sessionModel: "speed_typing_sessions" },
  { key: "story_chain", label: "Story Chain", sessionModel: "story_chain_sessions" },
  { key: "trivia", label: "Trivia", sessionModel: "trivia_sessions" },
  { key: "two_truths_lie", label: "Two Truths and a Lie", sessionModel: "two_truths_lie_sessions" },
  { key: "would_you_rather", label: "Would You Rather", sessionModel: "wyr_sessions", endedField: "ends_at" },
];

const ACTIVITY_KEYS = new Set(ACTIVITY_CATALOG.map((activity) => activity.key));

const activitySettingsSelect = {
  activity_key: true,
  enabled: true,
  reward_points: true,
  cooldown_seconds: true,
  channel_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.activity_settingsSelect;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getModelDelegate(
  prisma: ReturnType<typeof getPrisma>,
  modelName: keyof ReturnType<typeof getPrisma>
) {
  const delegate = prisma[modelName];

  if (
    !delegate ||
    typeof delegate !== "object" ||
    !("count" in delegate) ||
    !("findMany" in delegate)
  ) {
    throw new Error(`Unsupported activity session model: ${String(modelName)}`);
  }

  return delegate as {
    count: (args: unknown) => Promise<number>;
    findMany: (args: unknown) => Promise<
      {
        is_active: boolean;
        started_at: Date;
        ended_at?: Date | null;
        ends_at?: Date | null;
      }[]
    >;
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

function toActivitySettingResponse(
  activity: ActivityCatalogItem,
  setting?: ActivitySettingRecord
) {
  return {
    activityKey: activity.key,
    label: activity.label,
    enabled: setting?.enabled ?? true,
    rewardPoints: setting?.reward_points ?? 0,
    cooldownSeconds: setting?.cooldown_seconds ?? 0,
    channelId: formatBigInt(setting?.channel_id),
    configured: Boolean(setting),
    createdAt: formatDate(setting?.created_at),
    updatedAt: formatDate(setting?.updated_at),
  };
}

function getDefaultActivityPayload(warnings: string[] = []) {
  return {
    metrics: {
      activeActivitiesCount: 0,
      totalSessions: 0,
      trackedActivityTypes: ACTIVITY_CATALOG.length,
      configuredActivityTypes: 0,
      enabledActivityTypes: ACTIVITY_CATALOG.length,
    },
    activities: ACTIVITY_CATALOG.map((activity) =>
      toActivitySettingResponse(activity)
    ),
    recentSessions: [] as RecentSession[],
    warnings,
  };
}

function parseOptionalSnowflake(
  value: unknown,
  fieldName: string,
  errors: string[]
) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  return BigInt(trimmed);
}

function validateActivityPatch(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const rawActivities = Array.isArray(body.activities)
    ? body.activities
    : "activityKey" in body
      ? [body]
      : null;

  if (!rawActivities || rawActivities.length === 0) {
    return { error: "activities must contain at least one activity update." };
  }

  const errors: string[] = [];
  const activities: ActivityPatch[] = [];

  rawActivities.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`activities[${index}] must be a JSON object.`);
      return;
    }

    if (typeof item.activityKey !== "string" || !ACTIVITY_KEYS.has(item.activityKey)) {
      errors.push(`activities[${index}].activityKey is not supported.`);
      return;
    }

    const patch: ActivityPatch = { activityKey: item.activityKey };

    if ("enabled" in item) {
      if (typeof item.enabled === "boolean") {
        patch.enabled = item.enabled;
      } else {
        errors.push(`activities[${index}].enabled must be a boolean.`);
      }
    }

    if ("rewardPoints" in item) {
      if (
        typeof item.rewardPoints === "number" &&
        Number.isInteger(item.rewardPoints) &&
        item.rewardPoints >= 0
      ) {
        patch.rewardPoints = item.rewardPoints;
      } else {
        errors.push(`activities[${index}].rewardPoints must be a non-negative integer.`);
      }
    }

    if ("cooldownSeconds" in item) {
      if (
        typeof item.cooldownSeconds === "number" &&
        Number.isInteger(item.cooldownSeconds) &&
        item.cooldownSeconds >= 0
      ) {
        patch.cooldownSeconds = item.cooldownSeconds;
      } else {
        errors.push(`activities[${index}].cooldownSeconds must be a non-negative integer.`);
      }
    }

    if ("channelId" in item) {
      const channelId = parseOptionalSnowflake(
        item.channelId,
        `activities[${index}].channelId`,
        errors
      );

      if (channelId !== undefined) {
        patch.channelId = channelId?.toString() ?? null;
      }
    }

    if (Object.keys(patch).length === 1) {
      errors.push(`activities[${index}] does not include any supported fields.`);
    }

    activities.push(patch);
  });

  if (errors.length > 0) {
    return { error: "Invalid activity settings payload.", details: errors };
  }

  return { activities };
}

async function getSessionResult(
  prisma: ReturnType<typeof getPrisma>,
  guildIdBigInt: bigint,
  activity: ActivityCatalogItem
): Promise<ActivitySessionResult> {
  try {
    const delegate = getModelDelegate(prisma, activity.sessionModel);
    const [active, total, recent] = await Promise.all([
      delegate.count({ where: { guild_id: guildIdBigInt, is_active: true } }),
      delegate.count({ where: { guild_id: guildIdBigInt } }),
      delegate.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: { started_at: "desc" },
        take: 3,
        select: {
          is_active: true,
          started_at: true,
          [activity.endedField ?? "ended_at"]: true,
        },
      }),
    ]);

    return { activity, active, total, recent };
  } catch (error) {
    console.error("Failed to load activity session metrics", {
      activityKey: activity.key,
      sessionModel: activity.sessionModel,
      error,
    });

    return { activity, active: 0, total: 0, recent: [] };
  }
}

async function getStoredActivitySettings(
  prisma: ReturnType<typeof getPrisma>,
  guildIdBigInt: bigint
) {
  try {
    return await prisma.activity_settings.findMany({
      where: { guild_id: guildIdBigInt },
      select: activitySettingsSelect,
    });
  } catch (error) {
    console.error("Failed to load activity settings; using defaults", {
      guildId: guildIdBigInt.toString(),
      missingTable: isKnownMissingTableError(error),
      error,
    });

    return [] as ActivitySettingRecord[];
  }
}

async function getActivityPayload(guildIdBigInt: bigint) {
  const prisma = getPrisma();
  const sessionResults = await Promise.all(
    ACTIVITY_CATALOG.map((activity) =>
      getSessionResult(prisma, guildIdBigInt, activity)
    )
  );

  const storedSettings = await getStoredActivitySettings(prisma, guildIdBigInt);
  const settingsByKey = new Map(
    storedSettings.map((setting) => [setting.activity_key, setting])
  );
  const recentSessions: RecentSession[] = sessionResults
    .flatMap(({ activity, recent }) =>
      recent.map((session) => ({
        type: activity.label,
        activityKey: activity.key,
        status: session.is_active ? "Active" : "Ended",
        startedAt: formatDate(session.started_at),
        endedAt: formatDate(session.ended_at ?? session.ends_at ?? null),
      }))
    )
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))
    .slice(0, 10);

  return {
    metrics: {
      activeActivitiesCount: sessionResults.reduce(
        (total, result) => total + result.active,
        0
      ),
      totalSessions: sessionResults.reduce(
        (total, result) => total + result.total,
        0
      ),
      trackedActivityTypes: ACTIVITY_CATALOG.length,
      configuredActivityTypes: storedSettings.length,
      enabledActivityTypes: ACTIVITY_CATALOG.filter(
        (activity) => settingsByKey.get(activity.key)?.enabled ?? true
      ).length,
    },
    activities: ACTIVITY_CATALOG.map((activity) =>
      toActivitySettingResponse(activity, settingsByKey.get(activity.key))
    ),
    recentSessions,
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
    return NextResponse.json(await getActivityPayload(guildIdBigInt));
  } catch (error) {
    console.error("Failed to load server activities; returning safe defaults", {
      guildId,
      error,
    });

    return NextResponse.json(
      getDefaultActivityPayload(["Activity data could not be loaded."])
    );
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

  const validation = validateActivityPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();

    await prisma.$transaction(
      validation.activities.map((activity) =>
        prisma.activity_settings.upsert({
          where: {
            guild_id_activity_key: {
              guild_id: guildIdBigInt,
              activity_key: activity.activityKey,
            },
          },
          create: {
            guild_id: guildIdBigInt,
            activity_key: activity.activityKey,
            enabled: activity.enabled ?? true,
            reward_points: activity.rewardPoints ?? 0,
            cooldown_seconds: activity.cooldownSeconds ?? 0,
            channel_id:
              activity.channelId === undefined || activity.channelId === null
                ? null
                : BigInt(activity.channelId),
          },
          update: {
            ...(activity.enabled === undefined
              ? {}
              : { enabled: activity.enabled }),
            ...(activity.rewardPoints === undefined
              ? {}
              : { reward_points: activity.rewardPoints }),
            ...(activity.cooldownSeconds === undefined
              ? {}
              : { cooldown_seconds: activity.cooldownSeconds }),
            ...(activity.channelId === undefined
              ? {}
              : {
                  channel_id:
                    activity.channelId === null ? null : BigInt(activity.channelId),
                }),
          },
        })
      )
    );

    return NextResponse.json(await getActivityPayload(guildIdBigInt));
  } catch (error) {
    console.error("Failed to update server activity settings", {
      guildId,
      missingTable: isKnownMissingTableError(error),
      error,
    });

    return NextResponse.json(
      {
        ...getDefaultActivityPayload([
          "Activity settings could not be saved.",
        ]),
        error: "Failed to update server activity settings",
      },
      { status: 500 }
    );
  }
}
