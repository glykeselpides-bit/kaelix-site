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
    const [
      trackedUsers,
      points,
      eventsCount,
      factionsCount,
      participationCount,
      pointTransactionsCount,
    ] = await Promise.all([
      prisma.user_points.count({ where: { guild_id: guildIdBigInt } }),
      prisma.user_points.aggregate({
        where: { guild_id: guildIdBigInt },
        _sum: { points: true },
      }),
      prisma.events.count({ where: { guild_id: guildIdBigInt } }),
      prisma.factions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.participation.count({
        where: { events: { guild_id: guildIdBigInt } },
      }),
      prisma.point_transactions.count({ where: { guild_id: guildIdBigInt } }),
    ]);

    return NextResponse.json({
      metrics: {
        trackedUsers,
        totalPoints: points._sum.points ?? 0,
        eventsCount,
        factionsCount,
        participationCount,
        pointTransactionsCount,
      },
    });
  } catch (error) {
    console.error("Failed to load server analytics", error);

    return NextResponse.json(
      { error: "Failed to load server analytics" },
      { status: 500 }
    );
  }
}
