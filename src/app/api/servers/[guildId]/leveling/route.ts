import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { formatBigInt } from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
import { Fields, badRequest, isRecord, readBody, routeGuild, serverError } from "@/lib/dashboardRoute";
import { checkFeatureAllowed, featurePlanName, planHasFeature } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REWARDS = 50;
const MAX_BOOSTS = 50;

type Row = {
  announce: boolean;
  levelup_channel_id: bigint | null;
  levelup_message: string | null;
  stack_rewards: boolean;
  role_multipliers: Record<string, number>;
  channel_multipliers: Record<string, number>;
  anti_farm: boolean;
  min_message_length: number;
};

// Same defaults as the bot (bot/models/pro_features.py).
const DEFAULTS: Row = {
  announce: true,
  levelup_channel_id: null,
  levelup_message: null,
  stack_rewards: true,
  role_multipliers: {},
  channel_multipliers: {},
  anti_farm: false,
  min_message_length: 4,
};

function multipliers(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([id, amount]) => /^\d+$/.test(id) && typeof amount === "number")
  ) as Record<string, number>;
}

function fromDb(row: (Omit<Row, "role_multipliers" | "channel_multipliers"> & {
  role_multipliers: unknown;
  channel_multipliers: unknown;
}) | null): Row {
  if (!row) return { ...DEFAULTS };
  // Field by field, so the BigInt guild_id on the database row never reaches the JSON.
  return {
    announce: row.announce,
    levelup_channel_id: row.levelup_channel_id,
    levelup_message: row.levelup_message,
    stack_rewards: row.stack_rewards,
    anti_farm: row.anti_farm,
    min_message_length: row.min_message_length,
    role_multipliers: multipliers(row.role_multipliers),
    channel_multipliers: multipliers(row.channel_multipliers),
  };
}

function toResponse(row: Row) {
  return {
    ...row,
    levelup_channel_id: formatBigInt(row.levelup_channel_id) ?? "",
    levelup_message: row.levelup_message ?? "",
  };
}

async function rewardsOf(guildId: bigint) {
  const rows = await getPrisma().level_role_rewards.findMany({
    where: { guild_id: guildId },
    orderBy: [{ level: "asc" }, { id: "asc" }],
  });
  return rows.map((row) => ({ id: row.id, level: row.level, role_id: row.role_id.toString() }));
}

/** Reads a {discordId: multiplier} object. 1 means "no boost", so it's dropped (like /leveling boost). */
function readBoosts(fields: Fields, body: Record<string, unknown>, name: string): Record<string, number> | undefined {
  if (!(name in body)) return undefined;
  const value = body[name];
  if (!isRecord(value) || Object.keys(value).length > MAX_BOOSTS) {
    fields.errors.push(`${name} must list up to ${MAX_BOOSTS} boosts.`);
    return undefined;
  }
  const result: Record<string, number> = {};
  for (const [id, amount] of Object.entries(value)) {
    if (!/^\d{5,25}$/.test(id) || typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > 5) {
      fields.errors.push(`Each XP boost must be from 0 to 5.`);
      return undefined;
    }
    if (amount !== 1) result[id] = Math.round(amount * 100) / 100;
  }
  return result;
}

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  try {
    const prisma = getPrisma();
    const [row, { plan }, rewards] = await Promise.all([
      prisma.leveling_settings.findUnique({ where: { guild_id: guildId } }),
      getServerPlan(prisma, guildId),
      rewardsOf(guildId),
    ]);

    return NextResponse.json({
      allowed: planHasFeature(plan, "advancedLeveling"),
      planName: featurePlanName("advancedLeveling"),
      settings: toResponse(fromDb(row)),
      rewards,
      maxRewards: MAX_REWARDS,
    });
  } catch (error) {
    return serverError("load leveling settings", error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const changes: Partial<Row> = {};

  const announce = fields.bool("announce");
  const channel = fields.snowflake("levelup_channel_id");
  const message = fields.text("levelup_message", 500, true);
  const stack = fields.bool("stack_rewards");
  const antiFarm = fields.bool("anti_farm");
  const minLength = fields.int("min_message_length", 1, 50);
  const roleBoosts = readBoosts(fields, body, "role_multipliers");
  const channelBoosts = readBoosts(fields, body, "channel_multipliers");

  if (announce !== undefined) changes.announce = announce;
  if (channel !== undefined) changes.levelup_channel_id = channel;
  if (message !== undefined) changes.levelup_message = message;
  if (stack !== undefined) changes.stack_rewards = stack;
  if (antiFarm !== undefined) changes.anti_farm = antiFarm;
  if (minLength !== undefined) changes.min_message_length = minLength;
  if (roleBoosts !== undefined) changes.role_multipliers = roleBoosts;
  if (channelBoosts !== undefined) changes.channel_multipliers = channelBoosts;

  if (fields.failed) return badRequest("Invalid leveling settings.", fields.errors);
  if (Object.keys(changes).length === 0) return badRequest("No settings were provided.");

  try {
    const prisma = getPrisma();
    const locked = await checkFeatureAllowed(prisma, guildId, "advancedLeveling");
    if (locked) return locked;

    const existing = fromDb(await prisma.leveling_settings.findUnique({ where: { guild_id: guildId } }));
    const next = { ...existing, ...changes };
    const data = {
      ...changes,
      ...(changes.role_multipliers ? { role_multipliers: changes.role_multipliers as Prisma.InputJsonObject } : {}),
      ...(changes.channel_multipliers ? { channel_multipliers: changes.channel_multipliers as Prisma.InputJsonObject } : {}),
    };

    const saved = await prisma.leveling_settings.upsert({
      where: { guild_id: guildId },
      create: {
        guild_id: guildId,
        ...next,
        role_multipliers: next.role_multipliers as Prisma.InputJsonObject,
        channel_multipliers: next.channel_multipliers as Prisma.InputJsonObject,
      },
      update: data,
    });

    await logDashboardAction({
      guildId,
      actionType: "UPDATE",
      entityType: "LEVELING",
      entityId: guildId.toString(),
      summary: "Updated leveling settings",
      metadata: { fields: Object.keys(changes) },
    });

    return NextResponse.json({ settings: toResponse(fromDb(saved)) });
  } catch (error) {
    return serverError("save leveling settings", error);
  }
}

/** Add a level role reward, or change the level of an existing one for that role. */
export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const roleId = fields.snowflake("role_id");
  const level = fields.int("level", 1, 500);
  if (!roleId) fields.errors.push("Pick a role.");
  if (level === undefined && !fields.has("level")) fields.errors.push("Pick a level.");
  if (fields.failed || !roleId || level === undefined) return badRequest("Invalid role reward.", fields.errors);

  if (roleId === guildId) return badRequest("@everyone can't be a reward.");

  try {
    const prisma = getPrisma();
    const locked = await checkFeatureAllowed(prisma, guildId, "advancedLeveling");
    if (locked) return locked;

    const existing = await prisma.level_role_rewards.findFirst({ where: { guild_id: guildId, role_id: roleId } });
    if (existing) {
      await prisma.level_role_rewards.update({ where: { id: existing.id }, data: { level } });
    } else {
      const count = await prisma.level_role_rewards.count({ where: { guild_id: guildId } });
      if (count >= MAX_REWARDS) return badRequest(`Up to ${MAX_REWARDS} role rewards.`);
      await prisma.level_role_rewards.create({ data: { guild_id: guildId, role_id: roleId, level } });
    }

    await logDashboardAction({
      guildId,
      actionType: existing ? "UPDATE" : "CREATE",
      entityType: "LEVELING",
      entityId: roleId.toString(),
      summary: `Role reward at level ${level}`,
      metadata: { roleId, level },
    });

    return NextResponse.json({ rewards: await rewardsOf(guildId) });
  } catch (error) {
    return serverError("save the role reward", error);
  }
}

/** Remove a role reward (?id=). Always allowed, even after a downgrade. */
export async function DELETE(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return badRequest("Missing reward id.");

  try {
    const prisma = getPrisma();
    const { count } = await prisma.level_role_rewards.deleteMany({ where: { id, guild_id: guildId } });
    if (count === 0) return NextResponse.json({ error: "That reward doesn't exist." }, { status: 404 });

    await logDashboardAction({
      guildId,
      actionType: "DELETE",
      entityType: "LEVELING",
      entityId: String(id),
      summary: "Removed a level role reward",
    });

    return NextResponse.json({ rewards: await rewardsOf(guildId) });
  } catch (error) {
    return serverError("remove the role reward", error);
  }
}
