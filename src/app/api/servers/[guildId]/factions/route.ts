import { NextResponse } from "next/server";
import {
  formatBigInt,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return invalidGuildIdResponse();
  }

  try {
    const prisma = getPrisma();
    const factions = await prisma.factions.findMany({
      where: {
        guild_id: guildIdBigInt,
        is_active: true,
      },
      orderBy: { name: "asc" },
      select: {
        name: true,
        key: true,
        emoji: true,
        role_id: true,
        is_active: true,
      },
    });

    return NextResponse.json({
      factions: factions.map((faction) => ({
        name: faction.name,
        key: faction.key,
        emoji: faction.emoji,
        roleId: formatBigInt(faction.role_id),
        status: faction.is_active ? "Active" : "Inactive",
      })),
    });
  } catch (error) {
    console.error("Failed to load server factions", error);

    return NextResponse.json(
      { error: "Failed to load server factions" },
      { status: 500 }
    );
  }
}
