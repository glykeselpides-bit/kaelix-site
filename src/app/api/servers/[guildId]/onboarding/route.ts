import { NextResponse } from "next/server";
import {
  formatBigInt,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type GuildConfigRecord = {
  onboarding_enabled: boolean;
  active_quiz_id: bigint | null;
  allow_retake: boolean;
  result_visibility: string;
  welcome_channel_id: bigint | null;
};

type FactionRecord = {
  id: number;
  key: string;
  name: string;
  role_id: bigint | null;
  is_active: boolean;
};

const SKIPPED_FIELDS = [
  {
    field: "resultAnnouncementChannelId",
    reason: "No dedicated onboarding result announcement channel exists in schema.",
  },
  {
    field: "autoAssignFactionRole",
    reason: "Faction role links exist, but no onboarding auto-assign toggle exists in schema.",
  },
  {
    field: "onboardingTitle",
    reason: "No onboarding title field exists in schema.",
  },
  {
    field: "onboardingBody",
    reason: "No onboarding body field exists in schema.",
  },
  {
    field: "quizEnabled",
    reason: "No separate quiz enabled field exists in schema.",
  },
  {
    field: "customFactionsEnabled",
    reason: "No custom factions enabled field exists in schema.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function parseOptionalId(value: unknown, fieldName: string, errors: string[]) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return BigInt(value);
  }

  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a positive integer string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    errors.push(`${fieldName} must be a positive integer string.`);
    return undefined;
  }

  return BigInt(trimmed);
}

function toOnboardingResponse(config: GuildConfigRecord) {
  return {
    onboardingEnabled: config.onboarding_enabled,
    activeQuizId: formatBigInt(config.active_quiz_id),
    allowRetake: config.allow_retake,
    resultVisibility: config.result_visibility,
    showFactionResultPublicly: config.result_visibility === "public",
    welcomeChannelId: formatBigInt(config.welcome_channel_id),
  };
}

function toFactionResponse(faction: FactionRecord) {
  return {
    id: faction.id,
    key: faction.key,
    name: faction.name,
    roleId: formatBigInt(faction.role_id),
    hasLinkedRole: Boolean(faction.role_id),
    isActive: faction.is_active,
    status: faction.is_active ? "Active" : "Inactive",
  };
}

function validateOnboardingPatch(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];
  const data: Partial<{
    onboarding_enabled: boolean;
    active_quiz_id: bigint | null;
    allow_retake: boolean;
    result_visibility: string;
    welcome_channel_id: bigint | null;
  }> = {};

  if ("onboardingEnabled" in body) {
    if (typeof body.onboardingEnabled === "boolean") {
      data.onboarding_enabled = body.onboardingEnabled;
    } else {
      errors.push("onboardingEnabled must be a boolean.");
    }
  }

  if ("activeQuizId" in body) {
    const activeQuizId = parseOptionalId(
      body.activeQuizId,
      "activeQuizId",
      errors
    );

    if (activeQuizId !== undefined) {
      data.active_quiz_id = activeQuizId;
    }
  }

  if ("allowRetake" in body) {
    if (typeof body.allowRetake === "boolean") {
      data.allow_retake = body.allowRetake;
    } else {
      errors.push("allowRetake must be a boolean.");
    }
  }

  if ("showFactionResultPublicly" in body) {
    if (typeof body.showFactionResultPublicly === "boolean") {
      data.result_visibility = body.showFactionResultPublicly
        ? "public"
        : "private";
    } else {
      errors.push("showFactionResultPublicly must be a boolean.");
    }
  }

  if ("resultVisibility" in body) {
    if (typeof body.resultVisibility === "string") {
      const resultVisibility = body.resultVisibility.trim();

      if (resultVisibility.length > 0 && resultVisibility.length <= 20) {
        data.result_visibility = resultVisibility;
      } else {
        errors.push("resultVisibility must be 1-20 characters.");
      }
    } else {
      errors.push("resultVisibility must be a string.");
    }
  }

  if ("welcomeChannelId" in body) {
    const welcomeChannelId = parseOptionalSnowflake(
      body.welcomeChannelId,
      "welcomeChannelId",
      errors
    );

    if (welcomeChannelId !== undefined) {
      data.welcome_channel_id = welcomeChannelId;
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid onboarding payload.", details: errors };
  }

  if (Object.keys(data).length === 0) {
    return { error: "No supported onboarding fields were provided." };
  }

  return { data };
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
    const prisma = getPrisma();
    const [
      config,
      activeQuizCount,
      completedSessionsCount,
      assignedUsers,
      quizzes,
      factions,
    ] = await Promise.all([
        prisma.guild_config.findUnique({
          where: { guild_id: guildIdBigInt },
          select: {
            onboarding_enabled: true,
            active_quiz_id: true,
            allow_retake: true,
            result_visibility: true,
            welcome_channel_id: true,
          },
        }),
        prisma.faction_quizzes.count({
          where: { guild_id: guildIdBigInt, is_active: true },
        }),
        prisma.onboarding_sessions.count({
          where: {
            guild_id: guildIdBigInt,
            OR: [{ status: "completed" }, { completed_at: { not: null } }],
          },
        }),
        prisma.user_factions.findMany({
          where: { guild_id: guildIdBigInt },
          distinct: ["user_id"],
          select: { user_id: true },
        }),
        prisma.faction_quizzes.findMany({
          where: { guild_id: guildIdBigInt },
          orderBy: [{ is_active: "desc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            description: true,
            is_active: true,
            allow_retake: true,
          },
        }),
        prisma.factions.findMany({
          where: { guild_id: guildIdBigInt },
          orderBy: [{ is_active: "desc" }, { name: "asc" }],
          select: {
            id: true,
            key: true,
            name: true,
            role_id: true,
            is_active: true,
          },
        }),
      ]);

    return NextResponse.json({
      found: Boolean(config),
      onboarding: config ? toOnboardingResponse(config) : null,
      quizzes: quizzes.map((quiz) => ({
        id: quiz.id,
        name: quiz.name,
        description: quiz.description,
        isActive: quiz.is_active,
        allowRetake: quiz.allow_retake,
      })),
      factions: factions.map(toFactionResponse),
      skippedFields: SKIPPED_FIELDS,
      metrics: {
        onboardingEnabled: Boolean(config?.onboarding_enabled),
        activeQuizCount,
        completedSessionsCount,
        assignedUsersCount: assignedUsers.length,
      },
    });
  } catch (error) {
    console.error("Failed to load server onboarding", error);

    return NextResponse.json(
      { error: "Failed to load server onboarding" },
      { status: 500 }
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

  const validation = validateOnboardingPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existingConfig = await prisma.guild_config.findUnique({
      where: { guild_id: guildIdBigInt },
      select: { guild_id: true },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "No onboarding configuration found for this server yet." },
        { status: 404 }
      );
    }

    if (validation.data.active_quiz_id) {
      const quizId = Number(validation.data.active_quiz_id);
      const activeQuiz = await prisma.faction_quizzes.findFirst({
        where: { id: quizId, guild_id: guildIdBigInt },
        select: { id: true },
      });

      if (!activeQuiz) {
        return NextResponse.json(
          { error: "Active quiz was not found for this server." },
          { status: 404 }
        );
      }
    }

    const updatedConfig = await prisma.guild_config.update({
      where: { guild_id: guildIdBigInt },
      data: validation.data,
      select: {
        onboarding_enabled: true,
        active_quiz_id: true,
        allow_retake: true,
        result_visibility: true,
        welcome_channel_id: true,
      },
    });

    return NextResponse.json({
      found: true,
      onboarding: toOnboardingResponse(updatedConfig),
      skippedFields: SKIPPED_FIELDS,
    });
  } catch (error) {
    console.error("Failed to update server onboarding", error);

    return NextResponse.json(
      { error: "Failed to update server onboarding" },
      { status: 500 }
    );
  }
}
