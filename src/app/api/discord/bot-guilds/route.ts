import { NextResponse } from "next/server";

export async function GET() {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json(
      { error: "Missing bot token" },
      { status: 500 }
    );
  }

  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch bot guilds" },
      { status: response.status }
    );
  }

  const guilds = await response.json();

  return NextResponse.json(
    guilds.map((guild: { id: string }) => guild.id)
  );
}