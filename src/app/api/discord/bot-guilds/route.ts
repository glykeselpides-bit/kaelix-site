import { NextResponse } from "next/server";
import { getUserGuilds, guildListError } from "@/lib/guildAccess";

/**
 * Which of the logged-in user's servers Kaelix is in. Only the user's own
 * servers are returned, never the bot's full server list.
 */

// Short, so a server shows as connected soon after Kaelix is added to it.
const CACHE_MS = 20_000;
let cached: { expires: number; ids: Set<string> } | null = null;

async function fetchBotGuildIds(botToken: string): Promise<Set<string> | null> {
  const ids = new Set<string>();
  let after = "0";

  // Discord returns at most 200 servers per page.
  for (let page = 0; page < 50; page++) {
    const response = await fetch(
      `https://discord.com/api/users/@me/guilds?limit=200&after=${after}`,
      { headers: { Authorization: `Bot ${botToken}` }, cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const guilds: { id: string }[] = await response.json();
    guilds.forEach((guild) => ids.add(guild.id));

    if (guilds.length < 200) {
      break;
    }

    after = guilds[guilds.length - 1].id;
  }

  return ids;
}

export async function GET() {
  const user = await getUserGuilds();

  if (!user.ok) {
    return guildListError(user.reason);
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json(
      { error: "Missing bot token", reason: "bot_list_unavailable" },
      { status: 500 }
    );
  }

  if (!cached || cached.expires <= Date.now()) {
    const ids = await fetchBotGuildIds(botToken).catch(() => null);

    if (!ids) {
      return NextResponse.json(
        { error: "Couldn't fetch Kaelix's servers from Discord.", reason: "bot_list_unavailable" },
        { status: 503 }
      );
    }

    cached = { expires: Date.now() + CACHE_MS, ids };
  }

  const botIds = cached.ids;

  return NextResponse.json(
    user.guilds.filter((guild) => botIds.has(guild.id)).map((guild) => guild.id)
  );
}
