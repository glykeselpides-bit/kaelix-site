import { NextResponse } from "next/server";
import { formatBigInt } from "@/lib/dashboardApi";
import { getDashboardActorId, logDashboardAction } from "@/lib/dashboardAudit";
import { Fields, badRequest, readBody, routeGuild, serverError } from "@/lib/dashboardRoute";
import { checkLimitAllowed, featurePlanName, getLimit, planHasFeature } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
 * Custom !commands and auto-responders, the same rules as bot/cogs/custom_commands.py:
 * names are lowercase letters, numbers, - and _ (up to 32); triggers 2-100 characters;
 * replies up to 2,000. Core: 2 of each, Pro and Elite unlimited. After a downgrade the
 * oldest ones up to the limit keep working. Giving or taking a role needs Pro.
 */

const NAME_RE = /^[a-z0-9_-]{1,32}$/;
const MATCHES = ["contains", "starts", "exact"] as const;

async function listFor(guildId: bigint) {
  const prisma = getPrisma();
  const [commands, responders, { plan, planLabel }, commandLimit, responderLimit] = await Promise.all([
    prisma.custom_commands.findMany({ where: { guild_id: guildId }, orderBy: { id: "asc" } }),
    prisma.auto_responders.findMany({ where: { guild_id: guildId }, orderBy: { id: "asc" } }),
    getServerPlan(prisma, guildId),
    getLimit(prisma, guildId, "customCommands"),
    getLimit(prisma, guildId, "autoResponders"),
  ]);
  const roleActions = planHasFeature(plan, "customCommandRoles");

  return {
    planLabel,
    roleActions,
    rolePlan: featurePlanName("customCommandRoles"),
    limits: { commands: commandLimit, responders: responderLimit },
    commands: commands.map((row, index) => ({
      id: row.id,
      name: row.name,
      response: row.response,
      role_id: formatBigInt(row.role_id) ?? "",
      uses: row.uses,
      active: commandLimit < 0 || index < commandLimit,
    })),
    responders: responders.map((row, index) => ({
      id: row.id,
      trigger: row.trigger,
      match: row.match,
      response: row.response,
      uses: row.uses,
      active: responderLimit < 0 || index < responderLimit,
    })),
  };
}

function lockedRoles(planLabel: string) {
  return NextResponse.json(
    {
      error: `Giving or taking a role is included from the ${featurePlanName("customCommandRoles")} plan. This server is on ${planLabel}.`,
      reason: "plan_limit",
    },
    { status: 403 }
  );
}

function readName(fields: Fields): string | undefined {
  const raw = fields.text("name", 40);
  if (raw === undefined || raw === null) return undefined;
  const name = raw.toLowerCase().replace(/^!+/, "");
  if (!NAME_RE.test(name)) {
    fields.errors.push("Names can use letters, numbers, - and _ (up to 32).");
    return undefined;
  }
  return name;
}

function readTrigger(fields: Fields): string | undefined {
  const trigger = fields.text("trigger", 100);
  if (trigger === undefined || trigger === null) return undefined;
  if (trigger.length < 2) {
    fields.errors.push("Triggers need at least 2 characters.");
    return undefined;
  }
  return trigger;
}

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  try {
    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("load custom commands", error);
  }
}

/** Create: { kind: "command", name, response, role_id? } or { kind: "responder", trigger, match, response }. */
export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const kind = fields.oneOf("kind", ["command", "responder"] as const);
  const response = fields.text("response", 2000);
  if (!fields.has("response")) fields.errors.push("Write what Kaelix replies.");

  try {
    const prisma = getPrisma();
    const creator = (await getDashboardActorId()) ?? BigInt(0);

    if (kind === "command") {
      const name = readName(fields);
      if (!fields.has("name")) fields.errors.push("Give the command a name.");
      const roleId = fields.snowflake("role_id");
      if (fields.failed || !name || !response) return badRequest("Invalid custom command.", fields.errors);
      if (roleId === guildId) return badRequest("@everyone can't be given by a command.");

      const used = await prisma.custom_commands.count({ where: { guild_id: guildId } });
      const overLimit = await checkLimitAllowed(prisma, guildId, "customCommands", used);
      if (overLimit) return overLimit;

      if (roleId) {
        const { plan, planLabel } = await getServerPlan(prisma, guildId);
        if (!planHasFeature(plan, "customCommandRoles")) return lockedRoles(planLabel);
      }

      const exists = await prisma.custom_commands.findFirst({ where: { guild_id: guildId, name } });
      if (exists) return badRequest(`!${name} already exists. Edit it instead.`);

      const row = await prisma.custom_commands.create({
        data: { guild_id: guildId, name, response, role_id: roleId ?? null, uses: 0, created_by: creator, created_at: new Date() },
      });
      await logDashboardAction({ guildId, actionType: "CREATE", entityType: "CUSTOM_COMMAND", entityId: row.id, summary: `Created !${name}` });
      return NextResponse.json(await listFor(guildId));
    }

    if (kind === "responder") {
      const trigger = readTrigger(fields);
      if (!fields.has("trigger")) fields.errors.push("Give the trigger word or phrase.");
      const match = fields.oneOf("match", MATCHES) ?? "contains";
      if (fields.failed || !trigger || !response) return badRequest("Invalid auto-responder.", fields.errors);

      const used = await prisma.auto_responders.count({ where: { guild_id: guildId } });
      const overLimit = await checkLimitAllowed(prisma, guildId, "autoResponders", used);
      if (overLimit) return overLimit;

      const row = await prisma.auto_responders.create({
        data: { guild_id: guildId, trigger, match, response, uses: 0, created_by: creator, created_at: new Date() },
      });
      await logDashboardAction({ guildId, actionType: "CREATE", entityType: "AUTO_RESPONDER", entityId: row.id, summary: `Added auto-responder "${trigger}"` });
      return NextResponse.json(await listFor(guildId));
    }

    return badRequest("Invalid request.", fields.errors.length ? fields.errors : ["kind must be command or responder."]);
  } catch (error) {
    return serverError("save", error);
  }
}

/** Edit: { kind: "command", id, response?, role_id? } or { kind: "responder", id, trigger?, match?, response? }. */
export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const body = await readBody(request);
  if (body instanceof NextResponse) return body;

  const fields = new Fields(body);
  const kind = fields.oneOf("kind", ["command", "responder"] as const);
  const id = fields.int("id", 1, 2_147_483_647);
  const response = fields.text("response", 2000);

  try {
    const prisma = getPrisma();

    if (kind === "command") {
      const roleId = fields.snowflake("role_id");
      if (fields.failed || id === undefined) return badRequest("Invalid custom command.", fields.errors);
      if (roleId === guildId) return badRequest("@everyone can't be given by a command.");

      const existing = await prisma.custom_commands.findFirst({ where: { id, guild_id: guildId } });
      if (!existing) return NextResponse.json({ error: "That command doesn't exist." }, { status: 404 });

      // Adding or changing the role needs Pro; removing it is always allowed.
      if (roleId && roleId !== existing.role_id) {
        const { plan, planLabel } = await getServerPlan(prisma, guildId);
        if (!planHasFeature(plan, "customCommandRoles")) return lockedRoles(planLabel);
      }

      await prisma.custom_commands.update({
        where: { id },
        data: { ...(response ? { response } : {}), ...(roleId !== undefined ? { role_id: roleId } : {}) },
      });
      await logDashboardAction({ guildId, actionType: "UPDATE", entityType: "CUSTOM_COMMAND", entityId: id, summary: `Edited !${existing.name}` });
      return NextResponse.json(await listFor(guildId));
    }

    if (kind === "responder") {
      const trigger = readTrigger(fields);
      const match = fields.oneOf("match", MATCHES);
      if (fields.failed || id === undefined) return badRequest("Invalid auto-responder.", fields.errors);

      const { count } = await prisma.auto_responders.updateMany({
        where: { id, guild_id: guildId },
        data: { ...(trigger ? { trigger } : {}), ...(match ? { match } : {}), ...(response ? { response } : {}) },
      });
      if (count === 0) return NextResponse.json({ error: "That auto-responder doesn't exist." }, { status: 404 });
      await logDashboardAction({ guildId, actionType: "UPDATE", entityType: "AUTO_RESPONDER", entityId: id, summary: `Edited auto-responder #${id}` });
      return NextResponse.json(await listFor(guildId));
    }

    return badRequest("Invalid request.", fields.errors.length ? fields.errors : ["kind must be command or responder."]);
  } catch (error) {
    return serverError("save", error);
  }
}

/** Delete: ?kind=command|responder&id= */
export async function DELETE(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = Number(url.searchParams.get("id"));
  if ((kind !== "command" && kind !== "responder") || !Number.isInteger(id) || id <= 0) {
    return badRequest("Send kind (command or responder) and id.");
  }

  try {
    const prisma = getPrisma();
    const { count } = kind === "command"
      ? await prisma.custom_commands.deleteMany({ where: { id, guild_id: guildId } })
      : await prisma.auto_responders.deleteMany({ where: { id, guild_id: guildId } });
    if (count === 0) return NextResponse.json({ error: "That doesn't exist." }, { status: 404 });

    await logDashboardAction({
      guildId,
      actionType: "DELETE",
      entityType: kind === "command" ? "CUSTOM_COMMAND" : "AUTO_RESPONDER",
      entityId: id,
      summary: `Deleted ${kind === "command" ? "custom command" : "auto-responder"} #${id}`,
    });
    return NextResponse.json(await listFor(guildId));
  } catch (error) {
    return serverError("delete", error);
  }
}
