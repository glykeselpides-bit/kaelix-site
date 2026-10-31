import { NextResponse } from "next/server";
import { formatBigInt } from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
import { Fields, badRequest, readBody, routeGuild, serverError } from "@/lib/dashboardRoute";
import { getLimit } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same as DEFAULT_MESSAGES in bot/cogs/stream_alerts.py (used when message is empty).
const DEFAULT_MESSAGES: Record<string, string> = {
  twitch: "🔴 **{name}** is live on Twitch!",
  kick: "🟢 **{name}** is live on Kick!",
  youtube: "📺 **{name}** just posted: **{title}**\n{link}",
};

function link(platform: string, account: string, displayName: string) {
  if (platform === "twitch") return `https://twitch.tv/${account}`;
  if (platform === "youtube") return `https://www.youtube.com/channel/${account}`;
  if (platform === "kick") return `https://kick.com/${displayName}`;
  return null;
}

async function listFor(guildId: bigint) {
  const prisma = getPrisma();
  const [rows, { planLabel }, limit] = await Promise.all([
    prisma.stream_alerts.findMany({ where: { guild_id: guildId }, orderBy: { id: "asc" } }),
    getServerPlan(prisma, guildId),
    getLimit(prisma, guildId, "streamAlerts"),
  ]);

  return {
    planLabel,
    limit,
    defaults: DEFAULT_MESSAGES,
    // Like the bot, only the oldest alerts up to the plan's limit are checked.
    alerts: rows.map((row, index) => ({
      id: row.id,
      platform: row.platform,
      display_name: row.display_name,
      url: link(row.platform, row.account, row.display_name),
      channel_id: row.channel_id.toString(),
      ping_role_id: formatBigInt(row.ping_role_id) ?? "",
      message: row.message ?? "",
      active: limit < 0 || index < limit,
    })),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  try {
    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("load stream alerts", error);
  }
}

/** Change where an alert posts, who it pings, and its message: { id, channel_id?, ping_role_id?, message? }. */
export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const id = fields.int("id", 1, 2_147_483_647);
  const channel = fields.snowflake("channel_id");
  const role = fields.snowflake("ping_role_id");
  const message = fields.text("message", 500, true);

  if (fields.has("channel_id") && channel === null) fields.errors.push("Pick a channel.");
  if (fields.failed || id === undefined) return badRequest("Invalid alert.", fields.errors);

  const data: { channel_id?: bigint; ping_role_id?: bigint | null; message?: string | null } = {};
  if (channel) data.channel_id = channel;
  if (role !== undefined) data.ping_role_id = role;
  if (message !== undefined) data.message = message;
  if (Object.keys(data).length === 0) return badRequest("Nothing to change.");

  try {
    const prisma = getPrisma();
    const { count } = await prisma.stream_alerts.updateMany({ where: { id, guild_id: guildId }, data });
    if (count === 0) return NextResponse.json({ error: "That alert doesn't exist." }, { status: 404 });

    await logDashboardAction({
      guildId,
      actionType: "UPDATE",
      entityType: "STREAM_ALERT",
      entityId: id,
      summary: `Updated stream alert #${id}`,
      metadata: { fields: Object.keys(data) },
    });

    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("update the alert", error);
  }
}

/** Remove an alert (?id=). */
export async function DELETE(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return badRequest("Missing alert id.");

  try {
    const prisma = getPrisma();
    const { count } = await prisma.stream_alerts.deleteMany({ where: { id, guild_id: guildId } });
    if (count === 0) return NextResponse.json({ error: "That alert doesn't exist." }, { status: 404 });

    await logDashboardAction({
      guildId,
      actionType: "DELETE",
      entityType: "STREAM_ALERT",
      entityId: id,
      summary: `Removed stream alert #${id}`,
    });

    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("remove the alert", error);
  }
}
