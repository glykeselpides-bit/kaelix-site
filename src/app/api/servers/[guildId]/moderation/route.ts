import { NextResponse } from "next/server";
import { formatBigInt } from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
import type { PrismaClient } from "@/generated/prisma";
import { Fields, badRequest, readBody, routeGuild, serverError } from "@/lib/dashboardRoute";
import { featurePlanName, planHasFeature } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_WORDS = 500;
const MAX_EXEMPT = 50;

type Row = {
  enabled: boolean;
  block_spam: boolean;
  block_mass_mentions: boolean;
  mention_limit: number;
  block_invites: boolean;
  block_links: boolean;
  banned_words: string[];
  warn_threshold: number;
  timeout_minutes: number;
  exempt_role_ids: string[];
  exempt_channel_ids: string[];
  log_channel_id: bigint | null;
};

// Same defaults as the bot (bot/models/community.py).
const DEFAULTS: Row = {
  enabled: false,
  block_spam: true,
  block_mass_mentions: true,
  mention_limit: 5,
  block_invites: true,
  block_links: false,
  banned_words: [],
  warn_threshold: 0,
  timeout_minutes: 10,
  exempt_role_ids: [],
  exempt_channel_ids: [],
  log_channel_id: null,
};

function fromDb(row: {
  enabled: boolean;
  block_spam: boolean;
  block_mass_mentions: boolean;
  mention_limit: number;
  block_invites: boolean;
  block_links: boolean;
  banned_words: unknown;
  warn_threshold: number;
  timeout_minutes: number;
  exempt_role_ids: unknown;
  exempt_channel_ids: unknown;
  log_channel_id: bigint | null;
} | null): Row {
  if (!row) return { ...DEFAULTS };
  return {
    enabled: row.enabled,
    block_spam: row.block_spam,
    block_mass_mentions: row.block_mass_mentions,
    mention_limit: row.mention_limit,
    block_invites: row.block_invites,
    block_links: row.block_links,
    warn_threshold: row.warn_threshold,
    timeout_minutes: row.timeout_minutes,
    log_channel_id: row.log_channel_id,
    banned_words: Array.isArray(row.banned_words) ? row.banned_words.map(String) : [],
    // Filled in by loadAutomod from the raw JSON text (see below).
    exempt_role_ids: [],
    exempt_channel_ids: [],
  };
}

/*
 * The bot stores exempt role and channel IDs as JSON numbers (e.g. [123456789012345678]) and
 * compares them as numbers. Discord IDs are too big for JavaScript numbers, so reading them
 * through Prisma's JSON parsing would round them. These two columns are therefore read and
 * written as JSON text, keeping the exact digits and the bot's number format.
 */
function idsFromJsonText(text: string | null | undefined): string[] {
  return [...new Set((text ?? "").match(/\d{5,25}/g) ?? [])];
}

function idsToJsonText(ids: string[]): string {
  return `[${ids.filter((id) => /^\d{5,25}$/.test(id)).join(",")}]`;
}

async function loadAutomod(prisma: PrismaClient, guildId: bigint): Promise<Row | null> {
  const row = await prisma.automod_settings.findUnique({ where: { guild_id: guildId } });
  if (!row) return null;
  const [raw] = await prisma.$queryRaw<{ roles: string | null; channels: string | null }[]>`
    SELECT exempt_role_ids::text AS roles, exempt_channel_ids::text AS channels
    FROM automod_settings WHERE guild_id = ${guildId}`;
  return {
    ...fromDb(row),
    exempt_role_ids: idsFromJsonText(raw?.roles),
    exempt_channel_ids: idsFromJsonText(raw?.channels),
  };
}

// Field by field, so nothing else on the database row (like the BigInt guild_id) leaks into the JSON.
function toResponse(row: Row) {
  return {
    enabled: row.enabled,
    block_spam: row.block_spam,
    block_mass_mentions: row.block_mass_mentions,
    mention_limit: row.mention_limit,
    block_invites: row.block_invites,
    block_links: row.block_links,
    banned_words: row.banned_words,
    warn_threshold: row.warn_threshold,
    timeout_minutes: row.timeout_minutes,
    exempt_role_ids: row.exempt_role_ids,
    exempt_channel_ids: row.exempt_channel_ids,
    log_channel_id: formatBigInt(row.log_channel_id) ?? "",
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  try {
    const prisma = getPrisma();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [row, plan, cases, recent] = await Promise.all([
      loadAutomod(prisma, guildId),
      getServerPlan(prisma, guildId),
      prisma.mod_cases.findMany({ where: { guild_id: guildId }, orderBy: { id: "desc" }, take: 50 }),
      prisma.mod_cases.groupBy({
        by: ["action"],
        where: { guild_id: guildId, created_at: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      settings: toResponse(row ?? { ...DEFAULTS }),
      advancedAllowed: planHasFeature(plan.plan, "automodAdvanced"),
      advancedPlan: featurePlanName("automodAdvanced"),
      lastThirtyDays: Object.fromEntries(recent.map((item) => [item.action, item._count._all])),
      cases: cases.map((item) => ({
        id: item.id,
        user_id: item.user_id.toString(),
        moderator_id: formatBigInt(item.moderator_id),
        action: item.action,
        reason: item.reason,
        duration_minutes: item.duration_minutes,
        active: item.active,
        created_at: item.created_at.toISOString(),
      })),
    });
  } catch (error) {
    return serverError("load moderation settings", error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const changes: Partial<Row> = {};

  for (const name of ["enabled", "block_spam", "block_mass_mentions", "block_invites", "block_links"] as const) {
    const value = fields.bool(name);
    if (value !== undefined) changes[name] = value;
  }
  const mentionLimit = fields.int("mention_limit", 2, 50);
  const warnThreshold = fields.int("warn_threshold", 0, 20);
  const timeoutMinutes = fields.int("timeout_minutes", 1, 40320);
  const exemptRoles = fields.snowflakeList("exempt_role_ids", MAX_EXEMPT);
  const exemptChannels = fields.snowflakeList("exempt_channel_ids", MAX_EXEMPT);
  const logChannel = fields.snowflake("log_channel_id");

  if (mentionLimit !== undefined) changes.mention_limit = mentionLimit;
  if (warnThreshold !== undefined) changes.warn_threshold = warnThreshold;
  if (timeoutMinutes !== undefined) changes.timeout_minutes = timeoutMinutes;
  if (exemptRoles !== undefined) changes.exempt_role_ids = exemptRoles;
  if (exemptChannels !== undefined) changes.exempt_channel_ids = exemptChannels;
  if (logChannel !== undefined) changes.log_channel_id = logChannel;

  if ("banned_words" in body) {
    const raw = body.banned_words;
    if (!Array.isArray(raw) || raw.some((word) => typeof word !== "string")) {
      fields.errors.push("banned_words must be a list of words.");
    } else {
      // Stored lowercase and sorted, like /automod words.
      const words = [...new Set(raw.map((word: string) => word.trim().toLowerCase()).filter(Boolean))].sort();
      if (words.length > MAX_WORDS) fields.errors.push(`Up to ${MAX_WORDS} banned words.`);
      else if (words.some((word) => word.length > 100)) fields.errors.push("Each banned word must be 100 characters or fewer.");
      else changes.banned_words = words;
    }
  }

  if (fields.failed) return badRequest("Invalid AutoMod settings.", fields.errors);
  if (Object.keys(changes).length === 0) return badRequest("No settings were provided.");

  try {
    const prisma = getPrisma();
    const existing = (await loadAutomod(prisma, guildId)) ?? { ...DEFAULTS };

    // Banned words, link blocking and auto-timeouts need Core. Turning them off is always allowed.
    const addsWords = (changes.banned_words ?? []).some((word) => !existing.banned_words.includes(word));
    const turnsOnLinks = changes.block_links === true && !existing.block_links;
    const changesEscalation =
      (changes.warn_threshold !== undefined && changes.warn_threshold > 0 && changes.warn_threshold !== existing.warn_threshold) ||
      (changes.timeout_minutes !== undefined && changes.timeout_minutes !== existing.timeout_minutes && (changes.warn_threshold ?? existing.warn_threshold) > 0);

    if (addsWords || turnsOnLinks || changesEscalation) {
      const { plan, planLabel } = await getServerPlan(prisma, guildId);
      if (!planHasFeature(plan, "automodAdvanced")) {
        return NextResponse.json(
          {
            error: `Banned words, link blocking and auto-timeouts are included from the ${featurePlanName("automodAdvanced")} plan. This server is on ${planLabel}.`,
            reason: "plan_limit",
          },
          { status: 403 }
        );
      }
    }

    const next: Row = { ...existing, ...changes };
    // Everything except the exempt lists goes through Prisma; those are written as JSON text below.
    const { exempt_role_ids: _roles, exempt_channel_ids: _channels, ...plain } = changes;
    const { exempt_role_ids: _r, exempt_channel_ids: _c, ...nextPlain } = next;
    void _roles; void _channels; void _r; void _c;

    await prisma.$transaction(async (tx) => {
      await tx.automod_settings.upsert({
        where: { guild_id: guildId },
        create: { guild_id: guildId, ...nextPlain, exempt_role_ids: [], exempt_channel_ids: [] },
        update: plain,
      });
      await tx.$executeRaw`
        UPDATE automod_settings
        SET exempt_role_ids = ${idsToJsonText(next.exempt_role_ids)}::json,
            exempt_channel_ids = ${idsToJsonText(next.exempt_channel_ids)}::json
        WHERE guild_id = ${guildId}`;
    });

    await logDashboardAction({
      guildId,
      actionType: "UPDATE",
      entityType: "AUTOMOD",
      entityId: guildId.toString(),
      summary: "Updated AutoMod settings",
      // Don't copy the banned words themselves into the audit log.
      metadata: { fields: Object.keys(changes), bannedWordCount: next.banned_words.length },
    });

    return NextResponse.json({ settings: toResponse((await loadAutomod(prisma, guildId)) ?? next) });
  } catch (error) {
    return serverError("save AutoMod settings", error);
  }
}
