import { NextResponse } from "next/server";
import type { PrismaClient } from "@/generated/prisma";
import { getServerPlan, type PlanId } from "@/lib/serverPlan";

/**
 * Plan limits for things the dashboard can create, matching the bot
 * (bot/entitlements/defaults.py and bot/entitlements/limits.py), so the
 * dashboard can't be used to go past a plan's limits.
 *
 * -1 means unlimited.
 */

type Limits = {
  members: number;
  eventsPerMonth: number;
  customFactions: number;
};

export const PLAN_LIMITS: Record<PlanId, Limits> = {
  FREE: { members: 60, eventsPerMonth: 10, customFactions: 0 },
  CORE: { members: 200, eventsPerMonth: 30, customFactions: 4 },
  PRO: { members: 1000, eventsPerMonth: 100, customFactions: 12 },
  ELITE: { members: -1, eventsPerMonth: -1, customFactions: -1 },
};

/** The Kaelix preset faction pack. These don't count as custom factions. */
export const PRESET_FACTION_KEYS = new Set(["VANGUARD", "CIPHER", "VEIL", "EMBER"]);

export function isCustomFactionKey(key: string): boolean {
  return !PRESET_FACTION_KEYS.has(key.trim().toUpperCase());
}

function refuse(message: string) {
  return NextResponse.json(
    { error: message, reason: "plan_limit" },
    { status: 403 }
  );
}

const memberCountCache = new Map<string, { expires: number; count: number | null }>();

/** Approximate member count from Discord, or null if Discord can't be asked right now. */
async function getMemberCount(guildId: bigint): Promise<number | null> {
  const key = guildId.toString();
  const cached = memberCountCache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.count;
  }

  let count: number | null = null;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (botToken) {
    try {
      const response = await fetch(
        `https://discord.com/api/guilds/${key}?with_counts=true`,
        { headers: { Authorization: `Bot ${botToken}` }, cache: "no-store" }
      );

      if (response.ok) {
        const guild = await response.json();
        count = typeof guild.approximate_member_count === "number" ? guild.approximate_member_count : null;
      }
    } catch {
      count = null;
    }
  }

  // Five minutes on success; retry sooner if Discord didn't answer.
  memberCountCache.set(key, {
    expires: Date.now() + (count === null ? 30_000 : 300_000),
    count,
  });

  return count;
}

/** null if this server may create an event now, otherwise the response to send back. */
export async function checkEventAllowed(
  prisma: PrismaClient,
  guildId: bigint
): Promise<NextResponse | null> {
  const { plan, planLabel } = await getServerPlan(prisma, guildId);
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

  if (limits.members >= 0) {
    const members = await getMemberCount(guildId);

    // If Discord can't be reached, don't block: the bot checks again.
    if (members !== null && members > limits.members) {
      return refuse(
        `This server has ${members.toLocaleString()} members and the ${planLabel} plan covers up to ${limits.members.toLocaleString()}. Upgrade to create events.`
      );
    }
  }

  if (limits.eventsPerMonth >= 0) {
    // Same count as the bot: events created this calendar month (UTC),
    // not counting cancelled ones or recurring-series templates.
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const used = await prisma.events.count({
      where: {
        guild_id: guildId,
        is_series_template: false,
        status: { not: "cancelled" },
        created_at: { gte: monthStart, lt: nextMonth },
      },
    });

    if (used >= limits.eventsPerMonth) {
      return refuse(
        `This server has used ${used} of its ${limits.eventsPerMonth} events this month on the ${planLabel} plan. Upgrade for more.`
      );
    }
  }

  return null;
}

/**
 * null if a custom faction with this key may be made active now, otherwise
 * the response to send back. Preset factions are always allowed.
 * excludeFactionId: the faction being switched on (it isn't counted yet).
 */
export async function checkCustomFactionAllowed(
  prisma: PrismaClient,
  guildId: bigint,
  key: string,
  excludeFactionId?: number
): Promise<NextResponse | null> {
  if (!isCustomFactionKey(key)) {
    return null;
  }

  const { plan, planLabel } = await getServerPlan(prisma, guildId);
  const limit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE).customFactions;

  if (limit < 0) {
    return null;
  }

  const active = await prisma.factions.findMany({
    where: {
      guild_id: guildId,
      is_active: true,
      ...(excludeFactionId !== undefined ? { id: { not: excludeFactionId } } : {}),
    },
    select: { key: true },
  });

  const used = active.filter((faction: { key: string }) => isCustomFactionKey(faction.key)).length;

  if (used < limit) {
    return null;
  }

  return refuse(
    limit === 0
      ? `Custom factions aren't included in the ${planLabel} plan. Upgrade to add them.`
      : `This server has ${used} of its ${limit} active custom factions on the ${planLabel} plan. Upgrade for more, or switch one off.`
  );
}

/**
 * Which games each plan includes, using the website's activity keys. Matches
 * PLAN_ACTIVITIES in the bot (bot/entitlements/defaults.py). Elite: all.
 */
const FREE_GAMES = ["riddle", "would_you_rather", "true_false"];
const CORE_GAMES = [...FREE_GAMES, "quiz", "cipher", "hidden_word", "story_chain"];
const PRO_GAMES = [
  ...CORE_GAMES,
  "caption_this",
  "meme_war",
  "gif_battle",
  "two_truths_lie",
  "trivia",
];

const PLAN_GAMES: Record<PlanId, Set<string> | null> = {
  FREE: new Set(FREE_GAMES),
  CORE: new Set(CORE_GAMES),
  PRO: new Set(PRO_GAMES),
  ELITE: null,
};

const PLAN_ORDER: PlanId[] = ["FREE", "CORE", "PRO", "ELITE"];
const PLAN_NAMES: Record<PlanId, string> = { FREE: "Free", CORE: "Core", PRO: "Pro", ELITE: "Elite" };

export function planIncludesGame(plan: PlanId, activityKey: string): boolean {
  const games = PLAN_GAMES[plan] ?? PLAN_GAMES.FREE;
  return games === null || games.has(activityKey);
}

/** Name of the cheapest plan that includes this game ("Free", "Core", ...). */
export function lowestPlanForGame(activityKey: string): string {
  const plan = PLAN_ORDER.find((p) => planIncludesGame(p, activityKey)) ?? "ELITE";
  return PLAN_NAMES[plan];
}

/**
 * Plan-only features the dashboard shows or switches on, matching
 * PLAN_FEATURES in the bot (bot/entitlements/defaults.py).
 */
const FEATURE_MIN_PLAN = {
  analytics: "PRO",
  weeklySummary: "CORE",
} as const satisfies Record<string, PlanId>;

export type PlanFeature = keyof typeof FEATURE_MIN_PLAN;

const FEATURE_NAMES: Record<PlanFeature, string> = {
  analytics: "Analytics",
  weeklySummary: "Weekly server summary",
};

export function planHasFeature(plan: PlanId, feature: PlanFeature): boolean {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(FEATURE_MIN_PLAN[feature]);
}

/** e.g. "Pro": the cheapest plan with this feature. */
export function featurePlanName(feature: PlanFeature): string {
  return PLAN_NAMES[FEATURE_MIN_PLAN[feature]];
}

/** null if this server's plan includes the feature, otherwise the response to send back. */
export async function checkFeatureAllowed(
  prisma: PrismaClient,
  guildId: bigint,
  feature: PlanFeature
): Promise<NextResponse | null> {
  const { plan, planLabel } = await getServerPlan(prisma, guildId);

  if (planHasFeature(plan, feature)) {
    return null;
  }

  return refuse(
    `${FEATURE_NAMES[feature]} is included from the ${featurePlanName(feature)} plan. This server is on ${planLabel}.`
  );
}
