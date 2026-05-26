import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

function parseGuildId(guildId: string) {
  return /^\d+$/.test(guildId) ? BigInt(guildId) : null;
}

function bigintToString(value: bigint | null | undefined) {
  return value === null || value === undefined ? null : value.toString();
}

function settingsResponse(settings: {
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
}) {
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return NextResponse.json(
      { error: "Invalid Discord server ID" },
      { status: 400 }
    );
  }

  try {
    const prisma = getPrisma();

    let settings = await prisma.onboarding_settings.findUnique({
      where: { guild_id: guildIdBigInt },
    });

    if (!settings) {
      const legacyConfig = await prisma.guild_config.findUnique({
        where: { guild_id: guildIdBigInt },
        select: {
          onboarding_enabled: true,
          welcome_channel_id: true,
          allow_retake: true,
          result_visibility: true,
        },
      });

      settings = await prisma.onboarding_settings.create({
        data: {
          guild_id: guildIdBigInt,
          onboarding_enabled: legacyConfig?.onboarding_enabled ?? true,
          welcome_channel_id: bigintToString(legacyConfig?.welcome_channel_id),
          result_channel_id: null,
          allow_retakes: legacyConfig?.allow_retake ?? false,
          show_result_publicly: legacyConfig?.result_visibility !== "private",
          auto_assign_faction_role: true,
          onboarding_title: null,
          onboarding_body: null,
          quiz_enabled: true,
          custom_factions_enabled: false,
        },
      });
    }

    const [questions, factions] = await Promise.all([
      prisma.faction_quiz_questions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: {
          faction_quiz_options: {
            orderBy: [{ position: "asc" }, { id: "asc" }],
          },
        },
      }),

      prisma.factions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: [{ name: "asc" }],
      }),
    ]);

    return NextResponse.json({
      found: true,
      settings: settingsResponse(settings),
      questions: questions.map((question) => ({
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
      })),
      factions: factions.map((faction) => ({
        id: faction.id,
        key: faction.key,
        name: faction.name,
        roleId: bigintToString(faction.role_id),
        hasLinkedRole: Boolean(faction.role_id),
        isActive: faction.is_active,
        status: faction.is_active ? "Active" : "Inactive",
      })),
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
    return NextResponse.json(
      { error: "Invalid Discord server ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const updated = await getPrisma().onboarding_settings.upsert({
      where: { guild_id: guildIdBigInt },
      create: {
        guild_id: guildIdBigInt,
        onboarding_enabled: Boolean(body.onboardingEnabled),
        welcome_channel_id: body.welcomeChannelId || null,
        result_channel_id: body.resultChannelId || null,
        allow_retakes: Boolean(body.allowRetakes),
        show_result_publicly: Boolean(body.showResultPublicly),
        auto_assign_faction_role: Boolean(body.autoAssignFactionRole),
        onboarding_title: body.onboardingTitle || null,
        onboarding_body: body.onboardingBody || null,
        quiz_enabled: Boolean(body.quizEnabled),
        custom_factions_enabled: Boolean(body.customFactionsEnabled),
      },
      update: {
        onboarding_enabled: Boolean(body.onboardingEnabled),
        welcome_channel_id: body.welcomeChannelId || null,
        result_channel_id: body.resultChannelId || null,
        allow_retakes: Boolean(body.allowRetakes),
        show_result_publicly: Boolean(body.showResultPublicly),
        auto_assign_faction_role: Boolean(body.autoAssignFactionRole),
        onboarding_title: body.onboardingTitle || null,
        onboarding_body: body.onboardingBody || null,
        quiz_enabled: Boolean(body.quizEnabled),
        custom_factions_enabled: Boolean(body.customFactionsEnabled),
      },
    });

    return NextResponse.json({
      found: true,
      settings: settingsResponse(updated),
    });
  } catch (error) {
    console.error("Failed to update server onboarding", error);

    return NextResponse.json(
      { error: "Failed to update server onboarding" },
      { status: 500 }
    );
  }
}