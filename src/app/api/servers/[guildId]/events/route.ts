import { NextResponse } from "next/server";
import {
  formatBigInt,
  formatDate,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type EventRecord = {
  id: number;
  event_code: string;
  channel_id: bigint;
  name: string;
  starts_at: Date;
  source_timezone: string;
  reward_points: number;
  recurrence: string;
  status: string;
  created_at: Date;
};

const STATUS_VALUES = new Set(["scheduled", "active", "completed", "cancelled"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toEventResponse(event: EventRecord) {
  return {
    id: event.id,
    name: event.name,
    eventCode: event.event_code,
    startsAt: formatDate(event.starts_at),
    sourceTimezone: event.source_timezone,
    status: event.status,
    channelId: formatBigInt(event.channel_id),
    rewardPoints: event.reward_points,
    recurrence: event.recurrence,
    createdAt: formatDate(event.created_at),
  };
}

function parseRequiredBigInt(value: unknown, fieldName: string, errors: string[]) {
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return BigInt(0);
  }

  return BigInt(value.trim());
}

function parseDateValue(value: unknown, fieldName: string, errors: string[]) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldName} is required.`);
    return new Date();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    errors.push(`${fieldName} must be a valid date/time.`);
  }

  return date;
}

function normalizeOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateEventId(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  if (
    typeof body.id !== "number" ||
    !Number.isInteger(body.id) ||
    body.id <= 0
  ) {
    return { error: "id must be a positive integer." };
  }

  return { id: body.id };
}

function validateEventCreate(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];
  const now = new Date();
  const data: Prisma.eventsUncheckedCreateInput = {
    event_code: "",
    guild_id: BigInt(0),
    channel_id: parseRequiredBigInt(body.channelId, "channelId", errors),
    name: "",
    starts_at: parseDateValue(body.startsAt, "startsAt", errors),
    source_timezone: "UTC",
    created_by: BigInt(0),
    reward_points: 0,
    recurrence: "none",
    is_series_template: false,
    reminder_offsets: "",
    sent_reminders: "",
    notification_role_ids: "",
    status: "scheduled",
    created_at: now,
  };

  if (typeof body.name === "string") {
    const name = body.name.trim();

    if (name.length > 0 && name.length <= 100) {
      data.name = name;
    } else {
      errors.push("name must be 1-100 characters.");
    }
  } else {
    errors.push("name is required.");
  }

  if ("sourceTimezone" in body) {
    const sourceTimezone = normalizeOptionalString(body.sourceTimezone);

    if (
      sourceTimezone === undefined ||
      (sourceTimezone && sourceTimezone.length > 64)
    ) {
      errors.push("sourceTimezone must be 64 characters or fewer.");
    } else {
      data.source_timezone = sourceTimezone ?? "UTC";
    }
  }

  if ("createdBy" in body) {
    data.created_by = parseRequiredBigInt(body.createdBy, "createdBy", errors);
  }

  if ("rewardPoints" in body) {
    if (
      typeof body.rewardPoints === "number" &&
      Number.isInteger(body.rewardPoints) &&
      body.rewardPoints >= 0
    ) {
      data.reward_points = body.rewardPoints;
    } else {
      errors.push("rewardPoints must be a non-negative integer.");
    }
  }

  if ("status" in body) {
    if (typeof body.status === "string" && STATUS_VALUES.has(body.status)) {
      data.status = body.status;
    } else {
      errors.push("status must be scheduled, active, completed, or cancelled.");
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid event payload.", details: errors };
  }

  return { data };
}

function validateEventPatch(body: unknown) {
  const idValidation = validateEventId(body);

  if ("error" in idValidation) {
    return idValidation;
  }

  const bodyRecord = body as Record<string, unknown>;
  const errors: string[] = [];
  const data: Prisma.eventsUncheckedUpdateInput = {};

  if ("name" in bodyRecord) {
    if (typeof bodyRecord.name === "string") {
      const name = bodyRecord.name.trim();

      if (name.length > 0 && name.length <= 100) {
        data.name = name;
      } else {
        errors.push("name must be 1-100 characters.");
      }
    } else {
      errors.push("name must be a string.");
    }
  }

  if ("startsAt" in bodyRecord) {
    data.starts_at = parseDateValue(bodyRecord.startsAt, "startsAt", errors);
  }

  if ("channelId" in bodyRecord) {
    data.channel_id = parseRequiredBigInt(
      bodyRecord.channelId,
      "channelId",
      errors
    );
  }

  if ("sourceTimezone" in bodyRecord) {
    const sourceTimezone = normalizeOptionalString(bodyRecord.sourceTimezone);

    if (
      sourceTimezone === undefined ||
      (sourceTimezone && sourceTimezone.length > 64)
    ) {
      errors.push("sourceTimezone must be 64 characters or fewer.");
    } else {
      data.source_timezone = sourceTimezone ?? "UTC";
    }
  }

  if ("rewardPoints" in bodyRecord) {
    if (
      typeof bodyRecord.rewardPoints === "number" &&
      Number.isInteger(bodyRecord.rewardPoints) &&
      bodyRecord.rewardPoints >= 0
    ) {
      data.reward_points = bodyRecord.rewardPoints;
    } else {
      errors.push("rewardPoints must be a non-negative integer.");
    }
  }

  if ("status" in bodyRecord) {
    if (
      typeof bodyRecord.status === "string" &&
      STATUS_VALUES.has(bodyRecord.status)
    ) {
      data.status = bodyRecord.status;
    } else {
      errors.push("status must be scheduled, active, completed, or cancelled.");
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid event payload.", details: errors };
  }

  if (Object.keys(data).length === 0) {
    return { error: "No supported event fields were provided." };
  }

  return { id: idValidation.id, data };
}

function generateEventCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

async function createEventWithCode(
  prisma: ReturnType<typeof getPrisma>,
  data: Prisma.eventsUncheckedCreateInput
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await prisma.events.create({
        data: {
          ...data,
          event_code: generateEventCode(),
        },
        select: eventSelect,
      });
    } catch (error) {
      lastError = error;

      if (
        !(
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        )
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

const eventSelect = {
  id: true,
  name: true,
  event_code: true,
  starts_at: true,
  source_timezone: true,
  status: true,
  channel_id: true,
  reward_points: true,
  recurrence: true,
  created_at: true,
} satisfies Prisma.eventsSelect;

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
      orderBy: [{ starts_at: "asc" }, { created_at: "desc" }],
      select: eventSelect,
    });

    return NextResponse.json({
      events: events.map(toEventResponse),
    });
  } catch (error) {
    console.error("Failed to load server events", error);

    return NextResponse.json(
      { error: "Failed to load server events" },
      { status: 500 }
    );
  }
}

export async function POST(
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

  const validation = validateEventCreate(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const event = await createEventWithCode(prisma, {
      ...validation.data,
      guild_id: guildIdBigInt,
    });

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType: "CREATE",
      entityType: "EVENT",
      entityId: event.id,
      summary: `Created event "${event.name}"`,
      metadata: {
        eventCode: event.event_code,
        startsAt: event.starts_at,
        channelId: event.channel_id,
      },
    });

    return NextResponse.json(
      { event: toEventResponse(event) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create server event", error);

    return NextResponse.json(
      { error: "Failed to create server event" },
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

  const validation = validateEventPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  if (!("data" in validation)) {
    return NextResponse.json(
      { error: "No supported event fields were provided." },
      { status: 400 }
    );
  }

  try {
    const prisma = getPrisma();
    const existingEvent = await prisma.events.findFirst({
      where: {
        id: validation.id,
        guild_id: guildIdBigInt,
      },
      select: { id: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event was not found for this server." },
        { status: 404 }
      );
    }

    const event = await prisma.events.update({
      where: { id: validation.id },
      data: validation.data,
      select: eventSelect,
    });

    const actionType = validation.data.status === "cancelled" ? "DELETE" : "UPDATE";

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType,
      entityType: "EVENT",
      entityId: event.id,
      summary:
        actionType === "DELETE"
          ? `Cancelled event "${event.name}"`
          : `Updated event "${event.name}"`,
      metadata: {
        eventCode: event.event_code,
        fields: Object.keys(validation.data),
      },
    });

    return NextResponse.json({ event: toEventResponse(event) });
  } catch (error) {
    console.error("Failed to update server event", error);

    return NextResponse.json(
      { error: "Failed to update server event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  const validation = validateEventId(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existingEvent = await prisma.events.findFirst({
      where: {
        id: validation.id,
        guild_id: guildIdBigInt,
      },
      select: { id: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event was not found for this server." },
        { status: 404 }
      );
    }

    const event = await prisma.events.update({
      where: { id: validation.id },
      data: { status: "cancelled" },
      select: eventSelect,
    });

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType: "DELETE",
      entityType: "EVENT",
      entityId: event.id,
      summary: `Cancelled event "${event.name}"`,
      metadata: { eventCode: event.event_code, softDelete: true },
    });

    return NextResponse.json({
      event: toEventResponse(event),
      deleted: false,
      cancelled: true,
    });
  } catch (error) {
    console.error("Failed to cancel server event", error);

    return NextResponse.json(
      { error: "Failed to cancel server event" },
      { status: 500 }
    );
  }
}
