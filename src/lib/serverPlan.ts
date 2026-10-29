import type { PrismaClient } from "@/generated/prisma";

/**
 * Works out a server's current plan the same way the bot does
 * (bot/entitlements/service.py), so the dashboard never disagrees with it:
 *
 *   1. A developer plan override wins.
 *   2. Otherwise the stored guild_subscriptions row (trials, manual plans),
 *   3. unless the server has an active Discord purchase for an equal or
 *      higher plan, which then wins.
 *
 * Discord purchases live in the bot's discord_entitlements table. The SKU IDs
 * that map to each plan come from the same environment variables the bot
 * uses: KAELIX_SKU_CORE, KAELIX_SKU_PRO and (optional) KAELIX_SKU_ELITE.
 */

export type PlanId = "FREE" | "CORE" | "PRO" | "ELITE";

export type PlanSource =
  | "free"
  | "trial"
  | "subscription"
  | "discord"
  | "developer_override";

export type ServerPlan = {
  plan: PlanId;
  planLabel: string;
  source: PlanSource;
  status: string;
  billedThrough: "Discord" | null;
  trialUsed: boolean;
  trialEndsAt: Date | null;
  /** Renewal date for stored subscriptions. Discord doesn't share this with the bot. */
  currentPeriodEnd: Date | null;
  /** When access ends if the plan was cancelled (Discord or stored). */
  accessEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
};

const PLAN_RANK: Record<PlanId, number> = { FREE: 0, CORE: 1, PRO: 2, ELITE: 3 };

const PLAN_LABELS: Record<PlanId, string> = {
  FREE: "Free",
  CORE: "Core",
  PRO: "Pro",
  ELITE: "Elite",
};

function toPlanId(value: string | null | undefined): PlanId {
  const upper = (value ?? "").toUpperCase();
  if (upper === "ENTERPRISE") return "ELITE";
  return upper in PLAN_RANK ? (upper as PlanId) : "FREE";
}

function skuPlans(): Map<string, PlanId> {
  const map = new Map<string, PlanId>();
  const entries: [string | undefined, PlanId][] = [
    [process.env.KAELIX_SKU_CORE, "CORE"],
    [process.env.KAELIX_SKU_PRO, "PRO"],
    [process.env.KAELIX_SKU_ELITE, "ELITE"],
  ];
  for (const [raw, plan] of entries) {
    const id = raw?.trim();
    if (id && /^\d+$/.test(id)) map.set(id, plan);
  }
  return map;
}

type DiscordEntitlementRow = {
  sku_id: bigint;
  starts_at: Date | null;
  ends_at: Date | null;
};

async function activeDiscordPlan(
  prisma: PrismaClient,
  guildId: bigint,
  now: Date
): Promise<{ plan: PlanId; endsAt: Date | null } | null> {
  const plans = skuPlans();
  if (plans.size === 0) return null;

  let rows: DiscordEntitlementRow[];
  try {
    // Raw query: the table belongs to the bot and isn't in the Prisma schema.
    rows = await prisma.$queryRaw<DiscordEntitlementRow[]>`
      SELECT sku_id, starts_at, ends_at
      FROM discord_entitlements
      WHERE guild_id = ${guildId} AND deleted = false
    `;
  } catch (error) {
    // The bot creates the table on startup; until then there are no purchases.
    console.error("Could not read discord_entitlements", error);
    return null;
  }

  let best: { plan: PlanId; endsAt: Date | null } | null = null;
  for (const row of rows) {
    const plan = plans.get(row.sku_id.toString());
    if (!plan) continue;
    if (row.starts_at && row.starts_at > now) continue;
    if (row.ends_at && row.ends_at <= now) continue;
    if (!best || PLAN_RANK[plan] > PLAN_RANK[best.plan]) {
      best = { plan, endsAt: row.ends_at };
    }
  }
  return best;
}

export async function getServerPlan(
  prisma: PrismaClient,
  guildId: bigint
): Promise<ServerPlan> {
  const now = new Date();

  const [record, override, discord] = await Promise.all([
    prisma.guild_subscriptions.findUnique({ where: { guild_id: guildId } }),
    prisma.guild_feature_overrides.findFirst({
      where: {
        guild_id: guildId,
        key: "__PLAN__",
        source: "developer_override",
        expires_at: { gt: now },
        string_value: { not: null },
      },
      orderBy: [{ updated_at: "desc" }, { id: "desc" }],
    }),
    activeDiscordPlan(prisma, guildId, now),
  ]);

  const storedStatus = (record?.status ?? "inactive").toLowerCase();
  const trialEndsAt = record?.trial_ends_at ?? null;
  const periodEnd = record?.current_period_end ?? null;
  const base = {
    trialUsed: Boolean(record?.trial_used),
    trialEndsAt,
    currentPeriodEnd: periodEnd,
  };

  const result = (
    plan: PlanId,
    source: PlanSource,
    status: string,
    extra: Partial<ServerPlan> = {}
  ): ServerPlan => ({
    plan,
    planLabel: PLAN_LABELS[plan],
    source,
    status,
    billedThrough: null,
    accessEndsAt: null,
    cancelAtPeriodEnd: false,
    ...base,
    ...extra,
  });

  // 1. Developer override.
  if (override?.string_value) {
    return result(toPlanId(override.string_value), "developer_override", "Developer override", {
      accessEndsAt: override.expires_at,
    });
  }

  // 2. The stored row (same rules as the bot's _resolve_stored).
  let stored: ServerPlan = result("FREE", "free", "Free");
  if (record) {
    const plan = toPlanId(record.plan);
    const paidPeriodLeft = Boolean(periodEnd && periodEnd > now);

    if (storedStatus === "trialing" && trialEndsAt && trialEndsAt > now) {
      stored = result(plan, "trial", "Trialing", { accessEndsAt: trialEndsAt });
    } else if (
      (storedStatus === "active" && (periodEnd === null || paidPeriodLeft)) ||
      (["inactive", "canceled", "past_due"].includes(storedStatus) && paidPeriodLeft)
    ) {
      stored = result(plan, "subscription", record.cancel_at_period_end ? "Cancelling" : "Active", {
        accessEndsAt: record.cancel_at_period_end ? periodEnd : null,
        cancelAtPeriodEnd: record.cancel_at_period_end,
      });
    }
  }

  // 3. A Discord purchase for an equal or higher plan wins.
  if (discord && PLAN_RANK[discord.plan] >= PLAN_RANK[stored.plan]) {
    return result(discord.plan, "discord", discord.endsAt ? "Cancelled (access until end date)" : "Active", {
      billedThrough: "Discord",
      accessEndsAt: discord.endsAt,
      cancelAtPeriodEnd: discord.endsAt !== null,
      currentPeriodEnd: null,
    });
  }

  return stored;
}