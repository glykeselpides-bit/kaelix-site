import { NextResponse } from "next/server";
import { invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

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
    const [config, activeQuizCount, completedSessionsCount, assignedUsers] =
      await Promise.all([
        prisma.guild_config.findUnique({
          where: { guild_id: guildIdBigInt },
          select: { onboarding_enabled: true },
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
      ]);

    return NextResponse.json({
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
