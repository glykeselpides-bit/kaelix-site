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

type FactionRecord = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  role_id: bigint | null;
  emoji: string | null;
  color: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFactionResponse(faction: FactionRecord) {
  return {
    id: faction.id,
    key: faction.key,
    name: faction.name,
    description: faction.description,
    emoji: faction.emoji,
    color: faction.color,
    roleId: formatBigInt(faction.role_id),
    isActive: faction.is_active,
    status: faction.is_active ? "Active" : "Inactive",
    createdAt: formatDate(faction.created_at),
    updatedAt: formatDate(faction.updated_at),
  };
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

function parseOptionalBigInt(
  value: unknown,
  fieldName: string,
  errors: string[]
) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  return BigInt(trimmed);
}

function validateFactionId(body: unknown) {
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

function validateFactionCreate(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];
  const now = new Date();
  const data: Prisma.factionsUncheckedCreateInput = {
    guild_id: BigInt(0),
    key: "",
    name: "",
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  if (typeof body.key === "string") {
    const key = body.key.trim();

    if (key.length > 0 && key.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(key)) {
      data.key = key;
    } else {
      errors.push(
        "key must be 1-50 characters using letters, numbers, '_' or '-'."
      );
    }
  } else {
    errors.push("key is required.");
  }

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

  const description = normalizeOptionalString(body.description);
  if (description === undefined || (description && description.length > 500)) {
    errors.push("description must be 500 characters or fewer.");
  } else {
    data.description = description;
  }

  const emoji = normalizeOptionalString(body.emoji);
  if (emoji === undefined || (emoji && emoji.length > 50)) {
    errors.push("emoji must be 50 characters or fewer.");
  } else {
    data.emoji = emoji;
  }

  const color = normalizeOptionalString(body.color);
  if (color === undefined || (color && color.length > 20)) {
    errors.push("color must be 20 characters or fewer.");
  } else {
    data.color = color;
  }

  if ("roleId" in body) {
    const roleId = parseOptionalBigInt(body.roleId, "roleId", errors);

    if (roleId !== undefined) {
      data.role_id = roleId;
    }
  }

  if ("isActive" in body) {
    if (typeof body.isActive === "boolean") {
      data.is_active = body.isActive;
    } else {
      errors.push("isActive must be a boolean.");
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid faction payload.", details: errors };
  }

  return { data };
}

function validateFactionPatch(body: unknown) {
  const idValidation = validateFactionId(body);

  if ("error" in idValidation) {
    return idValidation;
  }

  const bodyRecord = body as Record<string, unknown>;
  const errors: string[] = [];
  const data: Prisma.factionsUncheckedUpdateInput = {
    updated_at: new Date(),
  };

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

  if ("description" in bodyRecord) {
    const description = normalizeOptionalString(bodyRecord.description);

    if (
      description === undefined ||
      (description && description.length > 500)
    ) {
      errors.push("description must be 500 characters or fewer.");
    } else {
      data.description = description;
    }
  }

  if ("emoji" in bodyRecord) {
    const emoji = normalizeOptionalString(bodyRecord.emoji);

    if (emoji === undefined || (emoji && emoji.length > 50)) {
      errors.push("emoji must be 50 characters or fewer.");
    } else {
      data.emoji = emoji;
    }
  }

  if ("color" in bodyRecord) {
    const color = normalizeOptionalString(bodyRecord.color);

    if (color === undefined || (color && color.length > 20)) {
      errors.push("color must be 20 characters or fewer.");
    } else {
      data.color = color;
    }
  }

  if ("roleId" in bodyRecord) {
    const roleId = parseOptionalBigInt(bodyRecord.roleId, "roleId", errors);

    if (roleId !== undefined) {
      data.role_id = roleId;
    }
  }

  if ("isActive" in bodyRecord) {
    if (typeof bodyRecord.isActive === "boolean") {
      data.is_active = bodyRecord.isActive;
    } else {
      errors.push("isActive must be a boolean.");
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid faction payload.", details: errors };
  }

  if (Object.keys(data).length === 1) {
    return { error: "No supported faction fields were provided." };
  }

  return { id: idValidation.id, data };
}

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
    const factions = await prisma.factions.findMany({
      where: {
        guild_id: guildIdBigInt,
      },
      orderBy: [{ is_active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        emoji: true,
        color: true,
        role_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      factions: factions.map(toFactionResponse),
    });
  } catch (error) {
    console.error("Failed to load server factions", error);

    return NextResponse.json(
      { error: "Failed to load server factions" },
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

  const validation = validateFactionCreate(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const faction = await prisma.factions.create({
      data: {
        ...validation.data,
        guild_id: guildIdBigInt,
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        emoji: true,
        color: true,
        role_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType: faction.is_active ? "CREATE" : "DISABLE",
      entityType: "FACTION",
      entityId: faction.id,
      summary: `Created faction "${faction.name}"`,
      metadata: { key: faction.key, roleId: faction.role_id },
    });

    return NextResponse.json(
      { faction: toFactionResponse(faction) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create server faction", error);

    return NextResponse.json(
      { error: "Failed to create server faction" },
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

  const validation = validateFactionPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  if (!("data" in validation)) {
    return NextResponse.json(
      { error: "No supported faction fields were provided." },
      { status: 400 }
    );
  }

  try {
    const prisma = getPrisma();
    const existingFaction = await prisma.factions.findFirst({
      where: {
        id: validation.id,
        guild_id: guildIdBigInt,
      },
      select: { id: true, name: true, is_active: true },
    });

    if (!existingFaction) {
      return NextResponse.json(
        { error: "Faction was not found for this server." },
        { status: 404 }
      );
    }

    const faction = await prisma.factions.update({
      where: { id: validation.id },
      data: validation.data,
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        emoji: true,
        color: true,
        role_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    const actionType =
      typeof validation.data.is_active === "boolean"
        ? validation.data.is_active
          ? "ENABLE"
          : "DISABLE"
        : "UPDATE";

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType,
      entityType: "FACTION",
      entityId: faction.id,
      summary:
        actionType === "ENABLE"
          ? `Enabled faction "${faction.name}"`
          : actionType === "DISABLE"
            ? `Disabled faction "${faction.name}"`
            : `Updated faction "${faction.name}"`,
      metadata: {
        previous: { name: existingFaction.name, isActive: existingFaction.is_active },
        fields: Object.keys(validation.data),
      },
    });

    return NextResponse.json({ faction: toFactionResponse(faction) });
  } catch (error) {
    console.error("Failed to update server faction", error);

    return NextResponse.json(
      { error: "Failed to update server faction" },
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

  const validation = validateFactionId(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existingFaction = await prisma.factions.findFirst({
      where: {
        id: validation.id,
        guild_id: guildIdBigInt,
      },
      select: { id: true, name: true },
    });

    if (!existingFaction) {
      return NextResponse.json(
        { error: "Faction was not found for this server." },
        { status: 404 }
      );
    }

    const faction = await prisma.factions.update({
      where: { id: validation.id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        emoji: true,
        color: true,
        role_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType: "DELETE",
      entityType: "FACTION",
      entityId: faction.id,
      summary: `Deactivated faction "${faction.name}"`,
      metadata: { previousName: existingFaction.name, softDelete: true },
    });

    return NextResponse.json({
      faction: toFactionResponse(faction),
      deleted: false,
      deactivated: true,
    });
  } catch (error) {
    console.error("Failed to deactivate server faction", error);

    return NextResponse.json(
      { error: "Failed to deactivate server faction" },
      { status: 500 }
    );
  }
}
