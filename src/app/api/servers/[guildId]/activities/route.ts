import { NextResponse } from "next/server";
import {
  formatDate,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type RecentSession = {
  type: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
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

  try {
    const prisma = getPrisma();
    const [
      captionActive,
      cipherActive,
      hiddenWordActive,
      storyChainActive,
      triviaActive,
      captionTotal,
      cipherTotal,
      hiddenWordTotal,
      storyChainTotal,
      triviaTotal,
      captionRecent,
      cipherRecent,
      hiddenWordRecent,
      storyChainRecent,
      triviaRecent,
    ] = await Promise.all([
      prisma.caption_this_sessions.count({
        where: { guild_id: guildIdBigInt, is_active: true },
      }),
      prisma.cipher_sessions.count({
        where: { guild_id: guildIdBigInt, is_active: true },
      }),
      prisma.hidden_word_sessions.count({
        where: { guild_id: guildIdBigInt, is_active: true },
      }),
      prisma.story_chain_sessions.count({
        where: { guild_id: guildIdBigInt, is_active: true },
      }),
      prisma.trivia_sessions.count({
        where: { guild_id: guildIdBigInt, is_active: true },
      }),
      prisma.caption_this_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.cipher_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.hidden_word_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.story_chain_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.trivia_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.caption_this_sessions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: { started_at: "desc" },
        take: 3,
        select: { is_active: true, started_at: true, ended_at: true },
      }),
      prisma.cipher_sessions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: { started_at: "desc" },
        take: 3,
        select: { is_active: true, started_at: true, ended_at: true },
      }),
      prisma.hidden_word_sessions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: { started_at: "desc" },
        take: 3,
        select: { is_active: true, started_at: true, ended_at: true },
      }),
      prisma.story_chain_sessions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: { started_at: "desc" },
        take: 3,
        select: { is_active: true, started_at: true, ended_at: true },
      }),
      prisma.trivia_sessions.findMany({
        where: { guild_id: guildIdBigInt },
        orderBy: { started_at: "desc" },
        take: 3,
        select: { is_active: true, started_at: true, ended_at: true },
      }),
    ]);

    const recentSessions: RecentSession[] = [
      ...captionRecent.map((session) => ({
        type: "Caption This",
        status: session.is_active ? "Active" : "Ended",
        startedAt: formatDate(session.started_at),
        endedAt: formatDate(session.ended_at),
      })),
      ...cipherRecent.map((session) => ({
        type: "Cipher",
        status: session.is_active ? "Active" : "Ended",
        startedAt: formatDate(session.started_at),
        endedAt: formatDate(session.ended_at),
      })),
      ...hiddenWordRecent.map((session) => ({
        type: "Hidden Word",
        status: session.is_active ? "Active" : "Ended",
        startedAt: formatDate(session.started_at),
        endedAt: formatDate(session.ended_at),
      })),
      ...storyChainRecent.map((session) => ({
        type: "Story Chain",
        status: session.is_active ? "Active" : "Ended",
        startedAt: formatDate(session.started_at),
        endedAt: formatDate(session.ended_at),
      })),
      ...triviaRecent.map((session) => ({
        type: "Trivia",
        status: session.is_active ? "Active" : "Ended",
        startedAt: formatDate(session.started_at),
        endedAt: formatDate(session.ended_at),
      })),
    ]
      .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))
      .slice(0, 10);

    return NextResponse.json({
      metrics: {
        activeActivitiesCount:
          captionActive +
          cipherActive +
          hiddenWordActive +
          storyChainActive +
          triviaActive,
        totalSessions:
          captionTotal +
          cipherTotal +
          hiddenWordTotal +
          storyChainTotal +
          triviaTotal,
        trackedActivityTypes: 5,
      },
      recentSessions,
    });
  } catch (error) {
    console.error("Failed to load server activities", error);

    return NextResponse.json(
      { error: "Failed to load server activities" },
      { status: 500 }
    );
  }
}
