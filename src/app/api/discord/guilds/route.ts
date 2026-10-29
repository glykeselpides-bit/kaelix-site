import { NextResponse } from "next/server";
import { getUserGuilds, guildListError } from "@/lib/guildAccess";

/** The logged-in user's Discord servers. Errors carry a "reason" the dashboard explains. */
export async function GET() {
  const list = await getUserGuilds();

  return list.ok ? NextResponse.json(list.guilds) : guildListError(list.reason);
}
