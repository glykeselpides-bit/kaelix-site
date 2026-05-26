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

type DashboardAuditLogRecord = {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  user_id: bigint | null;
  metadata: Prisma.JsonValue | null;
  created_at: Date;
};

type LegacyAuditLogRecord = {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_id: bigint | null;
  details: string | null;
  created_at: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingAuditTableError(error: unknown) {
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
    code === "P2022" ||
    message.includes("does not exist") ||
    message.includes("column") ||
    cause.includes("does not exist") ||
    cause.includes("column")
  );
}

function emptyLogsResponse(limit: number, offset: number, warning?: string) {
  return NextResponse.json({
    logs: [],
    ...(warning ? { warning } : {}),
    pagination: {
      limit,
      offset,
      total: 0,
      hasMore: false,
    },
  });
}

function toDashboardLogResponse(log: DashboardAuditLogRecord) {
  return {
    id: log.id,
    actionType: log.action_type,
    entityType: log.entity_type,
    entityId: log.entity_id,
    summary: log.summary,
    userId: formatBigInt(log.user_id),
    metadata: log.metadata,
    createdAt: formatDate(log.created_at),
  };
}

function toLegacyLogResponse(log: LegacyAuditLogRecord) {
  return {
    id: log.id,
    actionType: log.action_type,
    entityType: log.entity_type,
    entityId: log.entity_id,
    summary: log.details ?? `${log.action_type} ${log.entity_type}`,
    userId: formatBigInt(log.actor_id),
    metadata: null,
    createdAt: formatDate(log.created_at),
  };
}

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

    try {
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
        logs: logs.map(toDashboardLogResponse),
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + logs.length < total,
        },
      });
    } catch (dashboardLogError) {
      if (!isMissingAuditTableError(dashboardLogError)) {
        throw dashboardLogError;
      }
    }

    const legacyWhere: Prisma.audit_logsWhereInput = {
      guild_id: guildIdBigInt,
      ...(actionType ? { action_type: actionType } : {}),
      ...(entityType ? { entity_type: entityType } : {}),
    };

    try {
      const [logs, total] = await Promise.all([
        prisma.audit_logs.findMany({
          where: legacyWhere,
          orderBy: { created_at: "desc" },
          take: limit,
          skip: offset,
          select: {
            id: true,
            action_type: true,
            entity_type: true,
            entity_id: true,
            actor_id: true,
            details: true,
            created_at: true,
          },
        }),
        prisma.audit_logs.count({ where: legacyWhere }),
      ]);

      return NextResponse.json({
        logs: logs.map(toLegacyLogResponse),
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + logs.length < total,
        },
      });
    } catch (legacyLogError) {
      if (!isMissingAuditTableError(legacyLogError)) {
        throw legacyLogError;
      }

      return emptyLogsResponse(
        limit,
        offset,
        "Audit logs are not configured yet."
      );
    }
  } catch (error) {
    console.error("Failed to load server dashboard logs", error);

    return emptyLogsResponse(
      limit,
      offset,
      "Audit logs are not configured yet."
    );
  }
}
