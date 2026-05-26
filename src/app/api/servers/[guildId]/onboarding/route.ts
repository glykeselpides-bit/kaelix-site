import { NextResponse } from "next/server";
import {
  formatBigInt,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type OnboardingSettingsShape = {
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

type OnboardingSettingsPatch = Partial<OnboardingSettingsShape>;

const defaultOnboardingSettings: OnboardingSettingsShape = {
  onboarding_enabled: true,
  welcome_channel_id: null,
  result_channel_id: null,
  allow_retakes: false,
  show_result_publicly: true,
  auto_assign_faction_role: true,
  onboarding_title: null,
  onboarding_body: null,
  quiz_enabled: true,
  custom_factions_enabled: false,
};

const onboardingSettingsSelect = {
  onboarding_enabled: true,
  welcome_channel_id: true,
  result_channel_id: true,
  allow_retakes: true,
  show_result_publicly: true,
  auto_assign_faction_role: true,
  onboarding_title: true,
  onboarding_body: true,
  quiz_enabled: true,
  custom_factions_enabled: true,
} satisfies Prisma.onboarding_settingsSelect;

const onboardingQuestionSelect = {
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
} satisfies Prisma.faction_quiz_questionsSelect;

const onboardingFactionSelect = {
  id: true,
  key: true,
  name: true,
  role_id: true,
  is_active: true,
} satisfies Prisma.factionsSelect;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKnownMissingTableError(error: unknown) {
  if (!isRecord(error)) {
    return false;
  }

  const code = typeof error.code === "string" ? error.code : "";
  const message =
    typeof error.message === "string" ? error.message.toLowerCase() : "";
  const meta = isRecord(error.meta) ? error.meta : {};
  const cause = typeof meta.cause === "string" ? meta.cause.toLowerCase() : "";

  return (
    code === "P2021" ||
    message.includes("does not exist") ||
    cause.includes("does not exist")
  );
}

function settingsResponse(settings: OnboardingSettingsShape) {
  return {
    onboardingEnabled: settings.onboarding_enabled,
    quizEnabled: settings.quiz_enabled,
    allowRetakes: settings.allow_retakes,
    showResultPublicly: settings.show_result_publicly,
    autoAssignFactionRole: settings.auto_assign_faction_role,
    customFactionsEnabled: settings.custom_factions_enabled,
    welcomeChannelId: settings.welcome_channel_id,
    resultChannelId: settings.result_channel_id,
    onboardingTitle: settings.onboarding_title,
    onboardingBody: settings.onboarding_body,
  };
}

function parseOptionalChannelId(
  value: unknown,
  fieldName: string,
  errors: string[]
) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a Discord channel ID string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d{1,32}$/.test(trimmed)) {
    errors.push(`${fieldName} must be a Discord channel ID string.`);
    return undefined;
  }

  return trimmed;
}

function parseOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number | null,
  errors: string[]
) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (maxLength !== null && trimmed.length > maxLength) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer.`);
    return undefined;
  }

  return trimmed;
}

function validateOnboardingSettingsPatch(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const data: OnboardingSettingsPatch = {};
  const errors: string[] = [];

  const booleanFields = [
    ["onboardingEnabled", "onboarding_enabled"],
    ["quizEnabled", "quiz_enabled"],
    ["allowRetakes", "allow_retakes"],
    ["showResultPublicly", "show_result_publicly"],
    ["autoAssignFactionRole", "auto_assign_faction_role"],
    ["customFactionsEnabled", "custom_factions_enabled"],
  ] as const;

  for (const [clientField, dbField] of booleanFields) {
    if (clientField in body) {
      if (typeof body[clientField] === "boolean") {
        data[dbField] = body[clientField];
      } else {
        errors.push(`${clientField} must be a boolean.`);
      }
    }
  }

  if ("welcomeChannelId" in body) {
    const channelId = parseOptionalChannelId(
      body.welcomeChannelId,
      "welcomeChannelId",
      errors
    );

    if (channelId !== undefined) {
      data.welcome_channel_id = channelId;
    }
  }

  if ("resultChannelId" in body) {
    const channelId = parseOptionalChannelId(
      body.resultChannelId,
      "resultChannelId",
      errors
    );

    if (channelId !== undefined) {
      data.result_channel_id = channelId;
    }
  }

  if ("onboardingTitle" in body) {
    const title = parseOptionalText(
      body.onboardingTitle,
      "onboardingTitle",
      200,
      errors
    );

    if (title !== undefined) {
      data.onboarding_title = title;
    }
  }

  if ("onboardingBody" in body) {
    const onboardingBody = parseOptionalText(
      body.onboardingBody,
      "onboardingBody",
      null,
      errors
    );

    if (onboardingBody !== undefined) {
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

async function getLegacySettings(
  prisma: ReturnType<typeof getPrisma>,
  guildId: bigint
): Promise<Partial<OnboardingSettingsShape>> {
  try {
    const legacyConfig = await prisma.guild_config.findUnique({
      where: { guild_id: guildId },
      select: {
        onboarding_enabled: true,
        welcome_channel_id: true,
        allow_retake: true,
        result_visibility: true,
      },
    });

    if (!legacyConfig) {
      return {};
    }

    return {
      onboarding_enabled: legacyConfig.onboarding_enabled,
      welcome_channel_id: formatBigInt(legacyConfig.welcome_channel_id),
      allow_retakes: legacyConfig.allow_retake,
      show_result_publicly: legacyConfig.result_visibility !== "private",
    };
  } catch (error) {
    console.error("[onboarding] Failed to load legacy onboarding defaults", {
      message: error instanceof Error ? error.message : String(error),
    });

    return {};
  }
}

async function getOrCreateOnboardingSettings(
  prisma: ReturnType<typeof getPrisma>,
  guildId: bigint
) {
  const existingSettings = await prisma.onboarding_settings.findUnique({
    where: { guild_id: guildId },
    select: onboardingSettingsSelect,
  });

  if (existingSettings) {
    return existingSettings;
  }

  const legacySettings = await getLegacySettings(prisma, guildId);

  return prisma.onboarding_settings.create({
    data: {
      guild_id: guildId,
      ...defaultOnboardingSettings,
      ...legacySettings,
    },
    select: onboardingSettingsSelect,
  });
}

async function getSafeOnboardingSettings(
  prisma: ReturnType<typeof getPrisma>,
  guildId: bigint,
  warnings: string[]
) {
  try {
    return await getOrCreateOnboardingSettings(prisma, guildId);
  } catch (error) {
    if (isKnownMissingTableError(error)) {
      warnings.push("Onboarding settings table is missing.");
      console.error("[onboarding] Missing onboarding_settings table", {
        guildId: guildId.toString(),
        message: error instanceof Error ? error.message : String(error),
      });

      return {
        ...defaultOnboardingSettings,
        ...(await getLegacySettings(prisma, guildId)),
      };
    }

    throw error;
  }
}

async function getSafeQuestions(
  prisma: ReturnType<typeof getPrisma>,
  guildId: bigint,
  warnings: string[]
) {
  try {
    const questions = await prisma.faction_quiz_questions.findMany({
      where: { guild_id: guildId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: onboardingQuestionSelect,
    });

    return questions.map((question) => ({
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
    }));
  } catch (error) {
    if (isKnownMissingTableError(error)) {
      warnings.push("Onboarding quiz tables are missing.");
      console.error("[onboarding] Missing onboarding quiz tables", {
        guildId: guildId.toString(),
        message: error instanceof Error ? error.message : String(error),
      });

      return [];
    }

    throw error;
  }
}

async function getSafeFactions(prisma: ReturnType<typeof getPrisma>, guildId: bigint) {
  const factions = await prisma.factions.findMany({
    where: { guild_id: guildId },
    orderBy: [{ is_active: "desc" }, { name: "asc" }],
    select: onboardingFactionSelect,
  });

  return factions.map((faction) => ({
    id: faction.id,
    key: faction.key,
    name: faction.name,
    roleId: formatBigInt(faction.role_id),
    hasLinkedRole: Boolean(faction.role_id),
    isActive: faction.is_active,
    status: faction.is_active ? "Active" : "Inactive",
  }));
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
    const warnings: string[] = [];
    const settings = await getSafeOnboardingSettings(
      prisma,
      guildIdBigInt,
      warnings
    );
    const [questions, factions] = await Promise.all([
      getSafeQuestions(prisma, guildIdBigInt, warnings),
      getSafeFactions(prisma, guildIdBigInt),
    ]);

    return NextResponse.json({
      found: true,
      settings: settingsResponse(settings),
      questions,
      factions,
      ...(warnings.length > 0 ? { warnings } : {}),
    });
  } catch (error) {
    console.error("[onboarding] Failed to load server onboarding", {
      guildId,
      message: error instanceof Error ? error.message : String(error),
    });

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

  const validation = validateOnboardingSettingsPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const updated = await prisma.onboarding_settings.upsert({
      where: { guild_id: guildIdBigInt },
      create: {
        guild_id: guildIdBigInt,
        ...defaultOnboardingSettings,
        ...validation.data,
      },
      update: validation.data,
      select: onboardingSettingsSelect,
    });

    return NextResponse.json({
      found: true,
      settings: settingsResponse(updated),
    });
  } catch (error) {
    console.error("[onboarding] Failed to update server onboarding", {
      guildId,
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to update server onboarding" },
      { status: 500 }
    );
  }
}
