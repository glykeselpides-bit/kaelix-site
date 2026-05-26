import { NextResponse } from "next/server";
import {
  formatBigInt,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type OnboardingSettingsRecord = {
  onboarding_enabled: boolean;
  welcome_channel_id: string | null;
  result_channel_id: string | null;
  allow_retakes: boolean;
  show_result_publicly: boolean;
  auto_assign_faction_role: boolean;
  onboarding_title: string | null;
  onboarding_body: string | null;
  quiz_enabled: boolean;
  custom_factions_enabled: boolean;
};

type FactionRecord = {
  id: number;
  key: string;
  name: string;
  role_id: bigint | null;
  is_active: boolean;
};

type QuizOptionRecord = {
  id: number;
  label: string;
  faction_id: number | null;
  weight: number;
  position: number;
  is_active: boolean;
};

type QuizQuestionRecord = {
  id: number;
  question: string;
  position: number;
  is_active: boolean;
  faction_quiz_options: QuizOptionRecord[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalSnowflake(
  value: unknown,
  fieldName: string,
  errors: string[]
) {
  const normalized = normalizeOptionalString(value);

  if (normalized === undefined) {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  if (normalized === null) {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  return normalized;
}

function toSettingsResponse(settings: OnboardingSettingsRecord) {
  return {
    onboardingEnabled: settings.onboarding_enabled,
    welcomeChannelId: settings.welcome_channel_id,
    resultChannelId: settings.result_channel_id,
    allowRetakes: settings.allow_retakes,
    showResultPublicly: settings.show_result_publicly,
    autoAssignFactionRole: settings.auto_assign_faction_role,
    onboardingTitle: settings.onboarding_title,
    onboardingBody: settings.onboarding_body,
    quizEnabled: settings.quiz_enabled,
    customFactionsEnabled: settings.custom_factions_enabled,
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

function toQuestionResponse(question: QuizQuestionRecord) {
  return {
    id: question.id,
    question: question.question,
    position: question.position,
    isActive: question.is_active,
    options: question.faction_quiz_options.map((option) => ({
      id: option.id,
      label: option.label,
      factionId: option.faction_id,
      weight: option.weight,
      position: option.position,
      isActive: option.is_active,
    })),
  };
}

function validateSettingsPatch(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];
  const data: Partial<{
    onboarding_enabled: boolean;
    welcome_channel_id: string | null;
    result_channel_id: string | null;
    allow_retakes: boolean;
    show_result_publicly: boolean;
    auto_assign_faction_role: boolean;
    onboarding_title: string | null;
    onboarding_body: string | null;
    quiz_enabled: boolean;
    custom_factions_enabled: boolean;
  }> = {};

  const booleanFields = [
    ["onboardingEnabled", "onboarding_enabled"],
    ["allowRetakes", "allow_retakes"],
    ["showResultPublicly", "show_result_publicly"],
    ["autoAssignFactionRole", "auto_assign_faction_role"],
    ["quizEnabled", "quiz_enabled"],
    ["customFactionsEnabled", "custom_factions_enabled"],
  ] as const;

  for (const [requestKey, dbKey] of booleanFields) {
    if (requestKey in body) {
      if (typeof body[requestKey] === "boolean") {
        data[dbKey] = body[requestKey];
      } else {
        errors.push(`${requestKey} must be a boolean.`);
      }
    }
  }

  if ("welcomeChannelId" in body) {
    const channelId = parseOptionalSnowflake(
      body.welcomeChannelId,
      "welcomeChannelId",
      errors
    );

    if (channelId !== undefined) {
      data.welcome_channel_id = channelId;
    }
  }

  if ("resultChannelId" in body) {
    const channelId = parseOptionalSnowflake(
      body.resultChannelId,
      "resultChannelId",
      errors
    );

    if (channelId !== undefined) {
      data.result_channel_id = channelId;
    }
  }

  if ("onboardingTitle" in body) {
    const title = normalizeOptionalString(body.onboardingTitle);

    if (title === undefined || (title && title.length > 200)) {
      errors.push("onboardingTitle must be 200 characters or fewer.");
    } else {
      data.onboarding_title = title;
    }
  }

  if ("onboardingBody" in body) {
    const onboardingBody = normalizeOptionalString(body.onboardingBody);

    if (onboardingBody === undefined) {
      errors.push("onboardingBody must be a string.");
    } else {
      data.onboarding_body = onboardingBody;
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid onboarding settings payload.", details: errors };
  }

  if (Object.keys(data).length === 0) {
    return { error: "No supported onboarding settings were provided." };
  }

  return { data };
}

async function getOrCreateSettings(guildId: bigint) {
  const prisma = getPrisma();
  const existingSettings = await prisma.onboarding_settings.findUnique({
    where: { guild_id: guildId },
  });

  if (existingSettings) {
    return existingSettings;
  }

  const config = await prisma.guild_config.findUnique({
    where: { guild_id: guildId },
    select: {
      onboarding_enabled: true,
      welcome_channel_id: true,
      allow_retake: true,
      result_visibility: true,
    },
  });

  return prisma.onboarding_settings.create({
    data: {
      guild_id: guildId,
      onboarding_enabled: config?.onboarding_enabled ?? true,
      welcome_channel_id: formatBigInt(config?.welcome_channel_id) ?? null,
      allow_retakes: config?.allow_retake ?? false,
      show_result_publicly: config?.result_visibility !== "private",
    },
  });
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
      settings,
      questions,
      factions,
      completedSessionsCount,
      assignedUsers,
    ] = await Promise.all([
      getOrCreateSettings(guildIdBigInt),
      prisma.faction_quiz_questions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: {
          id: true,
          question: true,
          position: true,
          is_active: true,
          faction_quiz_options: {
            orderBy: [{ position: "asc" }, { id: "asc" }],
            select: {
              id: true,
              label: true,
              faction_id: true,
              weight: true,
              position: true,
              is_active: true,
            },
          },
        },
      }),
      prisma.factions.findMany({
        where: { guild_id: guildIdBigInt, is_active: true },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          key: true,
          name: true,
          role_id: true,
          is_active: true,
        },
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
    ]);

    return NextResponse.json({
      found: true,
      settings: toSettingsResponse(settings),
      questions: questions.map(toQuestionResponse),
      factions: factions.map(toFactionResponse),
      metrics: {
        onboardingEnabled: settings.onboarding_enabled,
        activeQuestionCount: questions.filter((question) => question.is_active)
          .length,
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

  const validation = validateSettingsPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const updatedSettings = await prisma.onboarding_settings.upsert({
      where: { guild_id: guildIdBigInt },
      create: {
        guild_id: guildIdBigInt,
        ...validation.data,
      },
      update: validation.data,
    });

    const actionType =
      typeof validation.data.onboarding_enabled === "boolean"
        ? validation.data.onboarding_enabled
          ? "ENABLE"
          : "DISABLE"
        : "UPDATE";

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType,
      entityType: "ONBOARDING",
      entityId: guildId,
      summary:
        actionType === "ENABLE"
          ? "Enabled onboarding"
          : actionType === "DISABLE"
            ? "Disabled onboarding"
            : "Updated onboarding settings",
      metadata: { fields: Object.keys(validation.data) },
    });

    return NextResponse.json({
      found: true,
      settings: toSettingsResponse(updatedSettings),
    });
  } catch (error) {
    console.error("Failed to update server onboarding", error);

    return NextResponse.json(
      { error: "Failed to update server onboarding" },
      { status: 500 }
    );
  }
}
