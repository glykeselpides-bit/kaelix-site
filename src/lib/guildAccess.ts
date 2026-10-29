import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Who may manage which server.
 *
 * Every /api/servers/[guildId] route and every /servers/[guildId] page checks
 * here first: the visitor must be logged in, and Discord must say they own the
 * server or have Administrator / Manage Server in it (the same rule the
 * dashboard uses to list servers).
 *
 * Discord rate-limits the "my servers" call, and one dashboard page makes
 * several API calls at once, so each login's server list is kept for a minute
 * and shared between those calls.
 */

export type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export type GuildListResult =
  | { ok: true; guilds: DiscordGuild[] }
  | { ok: false; reason: "not_logged_in" | "login_expired" | "discord_unavailable" };

const ADMINISTRATOR = BigInt(0x8);
const MANAGE_GUILD = BigInt(0x20);

export function canManageServer(guild: Pick<DiscordGuild, "owner" | "permissions">): boolean {
  if (guild.owner) {
    return true;
  }

  try {
    const bits = BigInt(guild.permissions);
    return (bits & ADMINISTRATOR) === ADMINISTRATOR || (bits & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

const CACHE_MS = 60_000;
const cache = new Map<string, { expires: number; result: Promise<GuildListResult> }>();

async function fetchGuilds(accessToken: string): Promise<GuildListResult> {
  try {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { ok: false, reason: "login_expired" };
    }

    if (!response.ok) {
      return { ok: false, reason: "discord_unavailable" };
    }

    const data = await response.json();
    return Array.isArray(data) ? { ok: true, guilds: data } : { ok: false, reason: "discord_unavailable" };
  } catch {
    return { ok: false, reason: "discord_unavailable" };
  }
}

/** The logged-in user's Discord servers (all of them, not just manageable ones). */
export async function getUserGuilds(): Promise<GuildListResult> {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return { ok: false, reason: "not_logged_in" };
  }

  const now = Date.now();
  const cached = cache.get(accessToken);

  if (cached && cached.expires > now) {
    return cached.result;
  }

  const result = fetchGuilds(accessToken);
  cache.set(accessToken, { expires: now + CACHE_MS, result });

  // Only keep successful lists; a failure should be retried on the next call.
  result.then((r) => {
    if (!r.ok) {
      cache.delete(accessToken);
    }
  });

  if (cache.size > 500) {
    for (const [key, entry] of cache) {
      if (entry.expires <= now) {
        cache.delete(key);
      }
    }
  }

  return result;
}

export type GuildAccess =
  | { ok: true; guild: DiscordGuild }
  | { ok: false; reason: "not_logged_in" | "login_expired" | "discord_unavailable" | "forbidden" };

export async function checkGuildAccess(guildId: string): Promise<GuildAccess> {
  if (!/^\d{5,25}$/.test(guildId)) {
    return { ok: false, reason: "forbidden" };
  }

  const list = await getUserGuilds();

  if (!list.ok) {
    return list;
  }

  const guild = list.guilds.find((g) => g.id === guildId);

  return guild && canManageServer(guild) ? { ok: true, guild } : { ok: false, reason: "forbidden" };
}

const API_ERRORS = {
  not_logged_in: { status: 401, message: "Log in with Discord to manage this server." },
  login_expired: { status: 401, message: "Your Discord login has expired. Log in again." },
  discord_unavailable: { status: 503, message: "Couldn't reach Discord to check your access. Try again in a moment." },
  forbidden: { status: 403, message: "You need Manage Server or Administrator in this server." },
} as const;

/**
 * For API routes. Returns an error response to send back, or null if the
 * visitor may manage this server:
 *
 *   const denied = await guardGuild(guildId);
 *   if (denied) return denied;
 */
export async function guardGuild(guildId: string): Promise<NextResponse | null> {
  const access = await checkGuildAccess(guildId);

  if (access.ok) {
    return null;
  }

  const { status, message } = API_ERRORS[access.reason];
  return NextResponse.json({ error: message, reason: access.reason }, { status });
}

/** Turns a failed guild-list result into the JSON error the dashboard expects. */
export function guildListError(reason: Exclude<GuildAccess, { ok: true }>["reason"]): NextResponse {
  const { status, message } = API_ERRORS[reason];
  return NextResponse.json({ error: message, reason }, { status });
}
