import { NextResponse } from "next/server";
import { invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const CHANNEL_TYPES = new Map([
  [0, "text"],
  [5, "announcement"],
  [15, "forum"],
]);

type DiscordChannel = {
  id: string;
  name: string;
  type: number;
  position?: number;
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
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Discord channels" },
        { status: response.status }
      );
    }

    const channels = (await response.json()) as DiscordChannel[];

    return NextResponse.json({
      channels: channels
        .filter((channel) => CHANNEL_TYPES.has(channel.type))
        .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          type: CHANNEL_TYPES.get(channel.type) ?? "text",
        })),
    });
  } catch (error) {
    console.error("Failed to load Discord channels", error);

    return NextResponse.json(
      { error: "Failed to load Discord channels" },
      { status: 500 }
    );
  }
}
