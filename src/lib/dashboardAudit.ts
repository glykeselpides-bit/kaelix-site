import { auth } from "@/auth";
import type { Prisma } from "@/generated/prisma";
import { getPrisma } from "@/lib/prisma";

export type DashboardActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ENABLE"
  | "DISABLE"
  | "END_SESSION";

export type DashboardEntityType =
  | "EVENT"
  | "FACTION"
  | "ONBOARDING"
  | "ACTIVITY"
  | "TRIVIA_QUESTION"
  | "SETTINGS";

type LogDashboardActionInput = {
  guildId: bigint;
  userId?: bigint | string | null;
  actionType: DashboardActionType;
  entityType: DashboardEntityType;
  entityId?: string | number | null;
  summary: string;
  metadata?: unknown;
};

function parseUserId(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)])
    );
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return String(value);
}

export async function getDashboardActorId() {
  const session = await auth();
  const user = session?.user as { id?: unknown } | undefined;

  return parseUserId(user?.id);
}

export async function logDashboardAction(input: LogDashboardActionInput) {
  try {
    const userId =
      typeof input.userId === "bigint"
        ? input.userId
        : parseUserId(input.userId) ?? (await getDashboardActorId());

    await getPrisma().dashboardAuditLog.create({
      data: {
        guild_id: input.guildId,
        user_id: userId,
        action_type: input.actionType,
        entity_type: input.entityType,
        entity_id:
          input.entityId === null || input.entityId === undefined
            ? null
            : String(input.entityId),
        summary: input.summary,
        metadata:
          input.metadata === null || input.metadata === undefined
            ? undefined
            : (toJsonSafe(input.metadata) as Prisma.InputJsonValue),
      },
    });
  } catch (error) {
    console.error("Failed to write dashboard audit log", error);
  }
}
