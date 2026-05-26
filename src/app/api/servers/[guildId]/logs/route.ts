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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return invalidGuildIdResponse();
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "25");
  const offsetParam = Number(url.searchParams.get("offset") ?? "0");
  const actionType = url.searchParams.get("action_type")?.trim();
  const entityType = url.searchParams.get("entity_type")?.trim();
  const limit =
    Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100)
      : 25;
  const offset =
    Number.isInteger(offsetParam) && offsetParam > 0 ? offsetParam : 0;

  try {
    const prisma = getPrisma();
    const where: Prisma.DashboardAuditLogWhereInput = {
      guild_id: guildIdBigInt,
      ...(actionType ? { action_type: actionType } : {}),
      ...(entityType ? { entity_type: entityType } : {}),
    };
    const [logs, total] = await Promise.all([
      prisma.dashboardAuditLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          action_type: true,
          entity_type: true,
          entity_id: true,
          summary: true,
          user_id: true,
          metadata: true,
          created_at: true,
        },
      }),
      prisma.dashboardAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        actionType: log.action_type,
        entityType: log.entity_type,
        entityId: log.entity_id,
        summary: log.summary,
        userId: formatBigInt(log.user_id),
        metadata: log.metadata,
        createdAt: formatDate(log.created_at),
      })),
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error("Failed to load server dashboard logs", error);

    return NextResponse.json(
      { error: "Failed to load server logs" },
      { status: 500 }
    );
  }
}
