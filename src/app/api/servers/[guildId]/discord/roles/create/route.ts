import { NextResponse } from "next/server";
import { invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

type DiscordError = {
  code?: number;
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRoleColor(value: unknown, errors: string[]) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    errors.push("color must be a hex color string.");
    return undefined;
  }

  const trimmed = value.trim();

  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
    errors.push("color must use a valid hex value like #7c3aed.");
    return undefined;
  }

  return Number.parseInt(trimmed.replace("#", ""), 16);
}

function getDiscordErrorMessage(status: number, data: DiscordError | null) {
  const code = data?.code;

  if (status === 401) {
    return "Discord rejected the bot token.";
  }

  if (status === 403 && code === 50013) {
    return "Kaelix needs the Manage Roles permission and a high enough bot role to create roles.";
  }

  if (status === 403) {
    return "Kaelix cannot access this server. Confirm the bot is in the guild and has permission to manage roles.";
  }

  if (status === 404 || code === 10004) {
    return "Discord could not find this server for the Kaelix bot.";
  }

  if (code === 50001) {
    return "Kaelix is missing access to this Discord server.";
  }

  if (data?.message) {
    return `Discord API error: ${data.message}`;
  }

  return "Discord role creation failed.";
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

  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json(
      { error: "Missing Discord bot token" },
      { status: 500 }
    );
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

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = parseRoleColor(body.color, errors);

  if (!name || name.length > 100) {
    errors.push("name must be 1-100 characters.");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Invalid Discord role payload.", details: errors },
      { status: 400 }
    );
  }

  const payload: { name: string; color?: number } = { name };

  if (color !== undefined) {
    payload.color = color;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const discordError = isRecord(data) ? (data as DiscordError) : null;
      const message = getDiscordErrorMessage(response.status, discordError);

      return NextResponse.json(
        { error: message, discordStatus: response.status },
        { status: response.status }
      );
    }

    const role = data as DiscordRole;

    return NextResponse.json(
      {
        role: {
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create Discord role", error);

    return NextResponse.json(
      { error: "Failed to create Discord role" },
      { status: 500 }
    );
  }
}
