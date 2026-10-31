import { NextResponse } from "next/server";
import { formatBigInt } from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
import { Fields, readBody, routeGuild, serverError, badRequest } from "@/lib/dashboardRoute";
import { featurePlanName, planHasFeature } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same defaults as the bot (bot/models/community.py).
const DEFAULT_WELCOME_MESSAGE = "Welcome to **{server}**, {user}! You're member #{count}.";
const DEFAULT_LEAVE_MESSAGE = "**{username}** has left **{server}**. We're now {count} members.";

type Row = {
  welcome_enabled: boolean;
  welcome_channel_id: bigint | null;
  welcome_message: string;
  welcome_card: boolean;
  leave_enabled: boolean;
  leave_channel_id: bigint | null;
  leave_message: string;
  leave_card: boolean;
};

const DEFAULTS: Row = {
  welcome_enabled: false,
  welcome_channel_id: null,
  welcome_message: DEFAULT_WELCOME_MESSAGE,
  welcome_card: false,
  leave_enabled: false,
  leave_channel_id: null,
  leave_message: DEFAULT_LEAVE_MESSAGE,
  leave_card: false,
};

function toResponse(row: Row) {
  return {
    welcome_enabled: row.welcome_enabled,
    welcome_channel_id: formatBigInt(row.welcome_channel_id) ?? "",
    welcome_message: row.welcome_message,
    welcome_card: row.welcome_card,
    leave_enabled: row.leave_enabled,
    leave_channel_id: formatBigInt(row.leave_channel_id) ?? "",
    leave_message: row.leave_message,
    leave_card: row.leave_card,
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  try {
    const prisma = getPrisma();
    const row = await prisma.welcome_settings.findUnique({ where: { guild_id: guildId } });
    const { plan } = await getServerPlan(prisma, guildId);

    return NextResponse.json({
      settings: toResponse(row ?? DEFAULTS),
      cardsAllowed: planHasFeature(plan, "welcomeCards"),
      cardsPlan: featurePlanName("welcomeCards"),
    });
  } catch (error) {
    return serverError("load welcome settings", error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const changes: Partial<Row> = {};

  for (const side of ["welcome", "leave"] as const) {
    const enabled = fields.bool(`${side}_enabled`);
    const channel = fields.snowflake(`${side}_channel_id`);
    const message = fields.text(`${side}_message`, 1000, true);
    const card = fields.bool(`${side}_card`);

    if (enabled !== undefined) changes[`${side}_enabled`] = enabled;
    if (channel !== undefined) changes[`${side}_channel_id`] = channel;
    if (message !== undefined) changes[`${side}_message`] = message ?? (side === "welcome" ? DEFAULT_WELCOME_MESSAGE : DEFAULT_LEAVE_MESSAGE);
    if (card !== undefined) changes[`${side}_card`] = card;
  }

  if (fields.failed) return badRequest("Invalid welcome settings.", fields.errors);
  if (Object.keys(changes).length === 0) return badRequest("No settings were provided.");

  try {
    const prisma = getPrisma();
    const existing = await prisma.welcome_settings.findUnique({ where: { guild_id: guildId } });
    const next: Row = { ...(existing ?? DEFAULTS), ...changes };

    for (const side of ["welcome", "leave"] as const) {
      if (next[`${side}_enabled`] && !next[`${side}_channel_id`]) {
        return badRequest(`Pick a channel for ${side === "welcome" ? "welcome" : "leave"} messages before turning them on.`);
      }
    }

    // Turning an image card on needs Core. Leaving one on after a downgrade is fine (the bot just sends text).
    const turningCardOn =
      (changes.welcome_card === true && !existing?.welcome_card) || (changes.leave_card === true && !existing?.leave_card);
    if (turningCardOn) {
      const { plan, planLabel } = await getServerPlan(prisma, guildId);
      if (!planHasFeature(plan, "welcomeCards")) {
        return NextResponse.json(
          {
            error: `Welcome image cards are included from the ${featurePlanName("welcomeCards")} plan. This server is on ${planLabel}.`,
            reason: "plan_limit",
          },
          { status: 403 }
        );
      }
    }

    const saved = await prisma.welcome_settings.upsert({
      where: { guild_id: guildId },
      create: { guild_id: guildId, ...next },
      update: changes,
    });

    await logDashboardAction({
      guildId,
      actionType: "UPDATE",
      entityType: "WELCOME",
      entityId: guildId.toString(),
      summary: "Updated welcome and leave messages",
      metadata: { fields: Object.keys(changes) },
    });

    return NextResponse.json({ settings: toResponse(saved) });
  } catch (error) {
    return serverError("save welcome settings", error);
  }
}
