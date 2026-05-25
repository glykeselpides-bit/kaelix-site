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
  managed?: boolean;
};

export async function GET(
  _request: Request,
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

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Discord roles" },
        { status: response.status }
      );
    }

    const roles = (await response.json()) as DiscordRole[];

    return NextResponse.json({
      roles: roles
        .filter((role) => role.id !== guildId && !role.managed)
        .sort((left, right) => right.position - left.position)
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
        })),
    });
  } catch (error) {
    console.error("Failed to load Discord roles", error);

    return NextResponse.json(
      { error: "Failed to load Discord roles" },
      { status: 500 }
    );
  }
}
