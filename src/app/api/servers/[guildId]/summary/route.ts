import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = BigInt(guildId);

  const [config, subscription, eventsCount, factionsCount, usersCount, totalPoints] =
    await Promise.all([
      prisma.guild_config.findUnique({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.guild_subscriptions.findUnique({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.events.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.factions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.user_points.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.user_points.aggregate({
        where: { guild_id: guildIdBigInt },
        _sum: { points: true },
      }),
    ]);

  return NextResponse.json({
    plan: subscription?.plan ?? "Free / Not set",
    status: subscription?.status ?? "Active / Not set",
    eventsCount,
    factionsCount,
    usersCount,
    totalPoints: totalPoints._sum.points ?? 0,
    config: {
      activities: Boolean(config?.enable_activities),
      achievements: Boolean(config?.enable_achievements),
      onboarding: Boolean(config?.onboarding_enabled),
      weeklySummary: Boolean(config?.weekly_summary_enabled),
      dmNotifications: Boolean(config?.send_dm_notifications),
      eventPoints: Boolean(config?.enable_event_points),
    },
  });
}