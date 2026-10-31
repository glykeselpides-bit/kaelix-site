import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import {
  AUTOPILOT_GAMES,
  PLAN_LABELS,
  gameByKey,
  gameName,
  planIncludes,
  whenText,
} from "@/lib/autopilotGames";
import { formatBigInt } from "@/lib/dashboardApi";
import { getDashboardActorId, logDashboardAction } from "@/lib/dashboardAudit";
import { Fields, badRequest, isRecord, isTimeZone, readBody, routeGuild, serverError } from "@/lib/dashboardRoute";
import { checkLimitAllowed, getLimit } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan, type PlanId } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIME_RE = /^(\d{1,2})[:.](\d{2})$/;

/** Which plan a schedule's game needs, or null if this plan has it. */
function lockFor(plan: PlanId, key: string): string | null {
  if (key === "custom") return plan === "ELITE" ? null : "Elite";
  const game = gameByKey(key);
  if (!game) return null;
  return planIncludes(plan, game) ? null : PLAN_LABELS[game.plan];
}

async function listFor(guildId: bigint) {
  const prisma = getPrisma();
  const [rows, { plan, planLabel }, limit, images] = await Promise.all([
    prisma.autopilot_schedules.findMany({ where: { guild_id: guildId }, orderBy: { id: "asc" } }),
    getServerPlan(prisma, guildId),
    getLimit(prisma, guildId, "autopilotSchedules"),
    prisma.autopilot_images.count({ where: { guild_id: guildId } }),
  ]);

  // Same rules as the bot's scheduler: paused, then game not in the plan, then over the
  // plan's limit, counting only active schedules, oldest first.
  const enabledIds = rows.filter((row) => row.enabled).map((row) => row.id);
  const schedules = rows.map((row) => {
    const options = isRecord(row.options) ? row.options : {};
    const needs = lockFor(plan, row.activity_key);
    const rank = enabledIds.indexOf(row.id);
    const status = !row.enabled
      ? "paused"
      : needs
        ? `needs ${needs}`
        : limit >= 0 && rank >= limit
          ? "over limit"
          : "active";
    return {
      id: row.id,
      game: row.activity_key,
      gameName: gameName(row.activity_key),
      when: whenText(row.weekday, row.hour, row.minute, row.timezone),
      channel_id: row.channel_id.toString(),
      title: row.title,
      ping_role_id: formatBigInt(row.ping_role_id),
      remind_minutes: row.remind_minutes,
      trivia_mode: row.trivia_mode,
      run_minutes: row.run_minutes,
      options: {
        submission_hours: typeof options.submission_hours === "number" ? options.submission_hours : null,
        voting_hours: typeof options.voting_hours === "number" ? options.voting_hours : null,
        reward: typeof options.reward === "number" ? options.reward : null,
        themes: Array.isArray(options.themes) ? options.themes.map(String) : [],
      },
      enabled: row.enabled,
      last_run_at: row.last_run_at?.toISOString() ?? null,
      status,
    };
  });

  return {
    plan,
    planLabel,
    limit,
    imagesCount: images,
    schedules,
    games: AUTOPILOT_GAMES.map((game) => ({
      key: game.key,
      name: game.name,
      style: game.style,
      closesAfter: game.closesAfter ?? null,
      allowed: planIncludes(plan, game),
      plan: PLAN_LABELS[game.plan],
    })),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  try {
    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("load Autopilot schedules", error);
  }
}

/** Add a schedule. Mirrors /autopilot add (custom games are added in Discord). */
export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const key = fields.oneOf("game", AUTOPILOT_GAMES.map((game) => game.key));
  const weekday = fields.int("weekday", -1, 6);
  const timeText = fields.text("time", 5);
  const timezone = fields.text("timezone", 50) ?? "UTC";
  const channelId = fields.snowflake("channel_id");
  const title = fields.text("title", 100, true);
  const pingRole = fields.snowflake("ping_role_id");
  const remind = fields.int("remind_minutes", 0, 180);
  const triviaMode = fields.oneOf("trivia_mode", ["individual", "faction"] as const);
  const runsFor = fields.int("runs_for", 5, 1440);
  const submissionHours = fields.int("submission_hours", 1, 72);
  const votingHours = fields.int("voting_hours", 1, 72);
  const reward = fields.int("reward", 1, 10000);

  if (key === undefined && !fields.has("game")) fields.errors.push("Pick a game.");
  if (weekday === undefined && !fields.has("weekday")) fields.errors.push("Pick a day.");
  if (!channelId && !fields.errors.some((e) => e.startsWith("channel_id"))) fields.errors.push("Pick a channel.");

  const match = timeText ? TIME_RE.exec(timeText) : null;
  const hour = match ? Number(match[1]) : NaN;
  const minute = match ? Number(match[2]) : NaN;
  if (!match || hour > 23 || minute > 59) fields.errors.push("Use 24-hour time like 20:00 or 08:30.");
  if (!isTimeZone(timezone)) fields.errors.push("Unknown time zone. Use a name like Europe/London, America/New_York or Asia/Karachi.");

  const game = key ? gameByKey(key) : undefined;
  const options: Record<string, unknown> = {};

  if (game?.style === "phased") {
    if (submissionHours !== undefined) options.submission_hours = submissionHours;
    if (votingHours !== undefined) options.voting_hours = votingHours;
    if (reward !== undefined) options.reward = reward;
  }

  if (key === "gif") {
    const raw = body.themes;
    const list = (Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? raw.split("|") : [])
      .map((theme) => theme.trim().slice(0, 200))
      .filter(Boolean)
      .slice(0, 50);
    if (list.length === 0) fields.errors.push("GIF Battle needs at least one theme.");
    options.themes = list;
  }

  if (fields.failed || !game || weekday === undefined || !channelId) {
    return badRequest("Invalid schedule.", fields.errors);
  }

  try {
    const prisma = getPrisma();
    const { plan, planLabel } = await getServerPlan(prisma, guildId);

    const used = await prisma.autopilot_schedules.count({ where: { guild_id: guildId } });
    const overLimit = await checkLimitAllowed(prisma, guildId, "autopilotSchedules", used);
    if (overLimit) return overLimit;

    if (!planIncludes(plan, game)) {
      return NextResponse.json(
        {
          error: `${game.name} is included from the ${PLAN_LABELS[game.plan]} plan, so Autopilot can't run it here yet. This server is on ${planLabel}.`,
          reason: "plan_limit",
        },
        { status: 403 }
      );
    }

    const creator = (await getDashboardActorId()) ?? BigInt(0);
    const row = await prisma.autopilot_schedules.create({
      data: {
        guild_id: guildId,
        channel_id: channelId,
        activity_key: game.key,
        // Faction Battle needs Pro; Autopilot itself needs Pro, so it's always allowed here.
        trivia_mode: game.key === "trivia" && triviaMode === "faction" ? "faction" : "individual",
        weekday,
        hour,
        minute,
        timezone,
        title: title ?? null,
        ping_role_id: pingRole ?? null,
        remind_minutes: remind ?? 0,
        run_minutes: game.closesAfter ? runsFor ?? 0 : 0,
        options: Object.keys(options).length ? (options as Prisma.InputJsonObject) : undefined,
        enabled: true,
        created_by: creator,
        created_at: new Date(),
      },
    });

    await logDashboardAction({
      guildId,
      actionType: "CREATE",
      entityType: "AUTOPILOT",
      entityId: row.id,
      summary: `Scheduled ${game.name}: ${whenText(weekday, hour, minute, timezone)}`,
    });

    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("add the schedule", error);
  }
}

/** Pause or resume: { id, enabled }. */
export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const id = fields.int("id", 1, 2_147_483_647);
  const enabled = fields.bool("enabled");
  if (fields.failed || id === undefined || enabled === undefined) return badRequest("Send the schedule id and enabled.", fields.errors);

  try {
    const prisma = getPrisma();
    const { count } = await prisma.autopilot_schedules.updateMany({ where: { id, guild_id: guildId }, data: { enabled } });
    if (count === 0) return NextResponse.json({ error: "That schedule doesn't exist." }, { status: 404 });

    await logDashboardAction({
      guildId,
      actionType: enabled ? "ENABLE" : "DISABLE",
      entityType: "AUTOPILOT",
      entityId: id,
      summary: `${enabled ? "Resumed" : "Paused"} Autopilot schedule #${id}`,
    });

    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("update the schedule", error);
  }
}

/** Delete a schedule (?id=). */
export async function DELETE(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return badRequest("Missing schedule id.");

  try {
    const prisma = getPrisma();
    const { count } = await prisma.autopilot_schedules.deleteMany({ where: { id, guild_id: guildId } });
    if (count === 0) return NextResponse.json({ error: "That schedule doesn't exist." }, { status: 404 });

    await logDashboardAction({
      guildId,
      actionType: "DELETE",
      entityType: "AUTOPILOT",
      entityId: id,
      summary: `Removed Autopilot schedule #${id}`,
    });

    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("remove the schedule", error);
  }
}
