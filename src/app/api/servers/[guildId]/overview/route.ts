import { NextResponse } from "next/server";
import { invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";
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
    const [
      trackedUsers,
      points,
      eventsHosted,
      activeFactions,
      cipherSessions,
      triviaSessions,
      emojiRaceSessions,
      captionThisSessions,
      gifBattleSessions,
      hiddenWordSessions,
      hotTakesSessions,
      mcqSessions,
      memeWarSessions,
      puzzleDropSessions,
      reflexSessions,
      riddleSessions,
      speedTypingSessions,
      storyChainSessions,
      twoTruthsLieSessions,
      wyrSessions,
    ] = await Promise.all([
      prisma.user_points.count({ where: { guild_id: guildIdBigInt } }),
      prisma.user_points.aggregate({
        where: { guild_id: guildIdBigInt },
        _sum: { points: true },
      }),
      prisma.events.count({ where: { guild_id: guildIdBigInt } }),
      prisma.factions.count({
        where: { guild_id: guildIdBigInt, is_active: true },
      }),
      prisma.cipher_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.trivia_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.emoji_race_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.caption_this_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.gif_battle_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.hidden_word_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.hot_takes_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.mcq_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.meme_war_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.puzzle_drop_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.reflex_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.riddle_sessions.count({ where: { guild_id: guildIdBigInt } }),
      prisma.speed_typing_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.story_chain_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.two_truths_lie_sessions.count({
        where: { guild_id: guildIdBigInt },
      }),
      prisma.wyr_sessions.count({ where: { guild_id: guildIdBigInt } }),
    ]);

    let weeklyEngagement: number | null = null;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      weeklyEngagement = await prisma.point_transactions.count({
        where: {
          guild_id: guildIdBigInt,
          created_at: {
            gte: sevenDaysAgo,
          },
        },
      });
    } catch (error) {
      console.error("Failed to load weekly engagement", error);
    }

    return NextResponse.json({
      metrics: {
        trackedUsers,
        totalPoints: points._sum.points ?? 0,
        eventsHosted,
        activeFactions,
        activitiesPlayed:
          cipherSessions +
          triviaSessions +
          emojiRaceSessions +
          captionThisSessions +
          gifBattleSessions +
          hiddenWordSessions +
          hotTakesSessions +
          mcqSessions +
          memeWarSessions +
          puzzleDropSessions +
          reflexSessions +
          riddleSessions +
          speedTypingSessions +
          storyChainSessions +
          twoTruthsLieSessions +
          wyrSessions,
        weeklyEngagement,
      },
    });
  } catch (error) {
    console.error("Failed to load server overview", error);

    return NextResponse.json(
      { error: "Failed to load server overview" },
      { status: 500 }
    );
  }
}
