import { NextResponse } from "next/server";
import {
  formatDate,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
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
    const events = await prisma.events.findMany({
      where: { guild_id: guildIdBigInt },
      orderBy: { starts_at: "desc" },
      take: 10,
      select: {
        name: true,
        event_code: true,
        starts_at: true,
        status: true,
        reward_points: true,
      },
    });

    return NextResponse.json({
      events: events.map((event) => ({
        name: event.name,
        eventCode: event.event_code,
        startsAt: formatDate(event.starts_at),
        status: event.status,
        rewardPoints: event.reward_points,
      })),
    });
  } catch (error) {
    console.error("Failed to load server events", error);

    return NextResponse.json(
      { error: "Failed to load server events" },
      { status: 500 }
    );
  }
}
