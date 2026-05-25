import { NextResponse } from "next/server";
import {
  formatBigInt,
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
    const logs = await prisma.audit_logs.findMany({
      where: { guild_id: guildIdBigInt },
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        action_type: true,
        entity_type: true,
        actor_id: true,
        target_user_id: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        actionType: log.action_type,
        entityType: log.entity_type,
        actorId: formatBigInt(log.actor_id),
        targetUserId: formatBigInt(log.target_user_id),
        createdAt: formatDate(log.created_at),
      })),
    });
  } catch (error) {
    console.error("Failed to load server logs", error);

    return NextResponse.json(
      { error: "Failed to load server logs" },
      { status: 500 }
    );
  }
}
