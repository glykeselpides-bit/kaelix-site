import { NextResponse } from "next/server";
import { gameName } from "@/lib/autopilotGames";
import { badRequest, isTimeZone, routeGuild, serverError } from "@/lib/dashboardRoute";
import { featurePlanName, planHasFeature } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
 * Server insights, the same report as /insights in Discord (bot/cogs/insights.py build_report),
 * worked out in SQL so big servers don't have to load every row. Read-only.
 */

const PERIODS = new Set([7, 30, 90]);
const DAY = 24 * 60 * 60 * 1000;

// point_transactions.source_type -> game key, same as GAME_SOURCES in the bot.
const GAME_SOURCES: Record<string, string> = {
  activity_quiz: "quiz", activity_trivia_reward: "trivia", activity_riddle_reward: "riddle",
  activity_cipher_reward: "cipher", activity_hidden_word_reward: "hidden", activity_true_false_reward: "true_false",
  activity_reflex_reward: "reflex", activity_emoji_race_reward: "emoji", speed_typing_reward: "typing",
  activity_meme_war_reward: "meme", activity_caption_this_reward: "caption", activity_hot_takes_reward: "hot",
  activity_two_truths_lie_guesser: "truths", two_truths_lie_submitter: "truths", activity_story_chain_line: "story",
  activity_gif_battle_reward: "gif", activity_puzzle_drop_reward: "puzzle", activity_wyr_participation: "wyr",
  activity_mcq_reward: "quiz",
};

const n = (value: unknown) => Number(value ?? 0);
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export async function GET(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const guildId = await routeGuild(params);
  if (guildId instanceof NextResponse) return guildId;

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? 30);
  const tz = url.searchParams.get("tz") || "UTC";
  if (!PERIODS.has(days)) return badRequest("days must be 7, 30 or 90.");
  if (!isTimeZone(tz)) return badRequest("Unknown time zone. Try Europe/London, America/New_York or Asia/Karachi.");

  try {
    const prisma = getPrisma();
    const { plan } = await getServerPlan(prisma, guildId);
    if (!planHasFeature(plan, "insights")) {
      return NextResponse.json({ allowed: false, planName: featurePlanName("insights") });
    }

    const now = new Date();
    const start = new Date(now.getTime() - days * DAY);
    const prevStart = new Date(now.getTime() - 2 * days * DAY);
    const weekAgo = new Date(now.getTime() - 7 * DAY);
    const startHour = new Date(start);
    startHour.setUTCMinutes(0, 0, 0);
    // Times go to SQL as ISO strings cast to timestamptz, so the database's own time zone setting can't shift them.
    const startDay = isoDay(start);
    const prevDay = isoDay(prevStart);
    const tzCheck = await prisma.$queryRaw<{ ok: boolean }[]>`SELECT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = ${tz}) AS ok`;
    if (!tzCheck[0]?.ok) return badRequest("Unknown time zone. Try Europe/London, America/New_York or Asia/Karachi.");

    const [heat, channels, daily, active, joinDays, retention, games, since] = await Promise.all([
      // Busiest hours in the chosen time zone (Monday = 0).
      prisma.$queryRaw<{ d: number; h: number; m: bigint }[]>`
        SELECT (EXTRACT(ISODOW FROM hour_start AT TIME ZONE ${tz})::int - 1) AS d,
               EXTRACT(HOUR FROM hour_start AT TIME ZONE ${tz})::int AS h,
               SUM(messages)::bigint AS m
        FROM channel_hourly_activity
        WHERE guild_id = ${guildId} AND hour_start >= ${startHour.toISOString()}::timestamptz
        GROUP BY 1, 2`,
      prisma.$queryRaw<{ channel_id: string; m: bigint }[]>`
        SELECT channel_id::text AS channel_id, SUM(messages)::bigint AS m
        FROM channel_hourly_activity
        WHERE guild_id = ${guildId} AND hour_start >= ${startHour.toISOString()}::timestamptz
        GROUP BY channel_id ORDER BY m DESC LIMIT 8`,
      prisma.$queryRaw<{ day: Date; users: bigint; m: bigint; v: bigint }[]>`
        SELECT day, COUNT(DISTINCT user_id)::bigint AS users, SUM(messages)::bigint AS m, SUM(voice_minutes)::bigint AS v
        FROM member_daily_activity
        WHERE guild_id = ${guildId} AND day >= ${startDay}::date
        GROUP BY day ORDER BY day`,
      prisma.$queryRaw<{ now_: bigint; before_: bigint }[]>`
        SELECT COUNT(DISTINCT user_id) FILTER (WHERE day >= ${startDay}::date)::bigint AS now_,
               COUNT(DISTINCT user_id) FILTER (WHERE day >= ${prevDay}::date AND day < ${startDay}::date)::bigint AS before_
        FROM member_daily_activity
        WHERE guild_id = ${guildId} AND day >= ${prevDay}::date`,
      prisma.$queryRaw<{ day: Date; joins: bigint; leaves: bigint }[]>`
        SELECT (at AT TIME ZONE 'UTC')::date AS day,
               COUNT(*) FILTER (WHERE event = 'join')::bigint AS joins,
               COUNT(*) FILTER (WHERE event = 'leave')::bigint AS leaves
        FROM member_join_log
        WHERE guild_id = ${guildId} AND at >= ${start.toISOString()}::timestamptz
        GROUP BY 1 ORDER BY 1`,
      // Growth and first-week retention, counted per member like the bot.
      prisma.$queryRaw<{ joined: bigint; left_: bigint; cohort: bigint; stayed: bigint; talked: bigint }[]>`
        WITH j AS (
          SELECT user_id,
                 MIN(at) FILTER (WHERE event = 'join') AS first_join,
                 BOOL_OR(event = 'leave') AS has_left
          FROM member_join_log
          WHERE guild_id = ${guildId} AND at >= ${start.toISOString()}::timestamptz
          GROUP BY user_id
        )
        SELECT COUNT(*) FILTER (WHERE first_join IS NOT NULL)::bigint AS joined,
               COUNT(*) FILTER (WHERE has_left)::bigint AS left_,
               COUNT(*) FILTER (WHERE first_join <= ${weekAgo.toISOString()}::timestamptz)::bigint AS cohort,
               COUNT(*) FILTER (WHERE first_join <= ${weekAgo.toISOString()}::timestamptz AND NOT has_left)::bigint AS stayed,
               COUNT(*) FILTER (WHERE first_join <= ${weekAgo.toISOString()}::timestamptz AND EXISTS (
                 SELECT 1 FROM member_daily_activity a
                 WHERE a.guild_id = ${guildId} AND a.user_id = j.user_id
                   AND (a.messages > 0 OR a.voice_minutes > 0)
                   AND a.day BETWEEN (j.first_join AT TIME ZONE 'UTC')::date
                                 AND ((j.first_join + interval '7 days') AT TIME ZONE 'UTC')::date
               ))::bigint AS talked
        FROM j`,
      // Per game and player: first play, plays, and whether they came back within a week.
      prisma.$queryRaw<{ source_type: string; user_id: bigint; first_at: Date; plays: bigint; returned: boolean }[]>`
        WITH fp AS (
          SELECT user_id, source_type, MIN(created_at) AS first_at, COUNT(*)::bigint AS plays
          FROM point_transactions
          WHERE guild_id = ${guildId} AND amount > 0 AND created_at >= ${start.toISOString()}::timestamptz
            AND source_type = ANY(${Object.keys(GAME_SOURCES)})
          GROUP BY user_id, source_type
        )
        SELECT fp.source_type, fp.user_id, fp.first_at, fp.plays,
               EXISTS (
                 SELECT 1 FROM member_daily_activity a
                 WHERE a.guild_id = ${guildId} AND a.user_id = fp.user_id
                   AND (a.messages > 0 OR a.voice_minutes > 0)
                   AND a.day > (fp.first_at AT TIME ZONE 'UTC')::date
                   AND a.day <= ((fp.first_at + interval '7 days') AT TIME ZONE 'UTC')::date
               ) AS returned
        FROM fp`,
      prisma.$queryRaw<{ since: Date | null }[]>`
        SELECT MIN(day) AS since FROM member_daily_activity WHERE guild_id = ${guildId}`,
    ]);

    // Heat map: total messages per weekday/hour, and the bot's "best times" (average per week).
    const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    for (const row of heat) grid[n(row.d)][n(row.h)] = n(row.m);
    const weeks = Math.max(1, days / 7);
    const best = grid
      .flatMap((row, d) => row.map((m, h) => ({ day: d, hour: h, avg: m / weeks })))
      .filter((slot) => slot.avg > 0)
      // Same order as the bot: busiest first, ties to the later day and hour.
      .sort((a, b) => b.avg - a.avg || b.day - a.day || b.hour - a.hour)
      .slice(0, 3);

    // One row per UTC day in the period, zeros where nothing happened.
    const byDay = new Map(daily.map((row) => [isoDay(row.day), row]));
    const joinsByDay = new Map(joinDays.map((row) => [isoDay(row.day), row]));
    const series = [];
    for (let t = new Date(`${startDay}T00:00:00Z`).getTime(); t <= now.getTime(); t += DAY) {
      const key = isoDay(new Date(t));
      const row = byDay.get(key);
      const joins = joinsByDay.get(key);
      series.push({
        date: key,
        active: n(row?.users),
        messages: n(row?.m),
        voiceMinutes: n(row?.v),
        joins: n(joins?.joins),
        leaves: n(joins?.leaves),
      });
    }
    const inPeriod = series.filter((day) => day.date >= startDay);

    // Games: merge sources that belong to the same game, keeping each player's earliest play.
    const perPlayer = new Map<string, { first: number; returned: boolean }>();
    const playsByGame = new Map<string, number>();
    for (const row of games) {
      const game = GAME_SOURCES[row.source_type];
      if (!game) continue;
      playsByGame.set(game, (playsByGame.get(game) ?? 0) + n(row.plays));
      const key = `${game}:${row.user_id}`;
      const first = new Date(row.first_at).getTime();
      const seen = perPlayer.get(key);
      if (!seen || first < seen.first) perPlayer.set(key, { first, returned: row.returned });
    }
    const gameStats = new Map<string, { players: number; returned: number }>();
    for (const [key, value] of perPlayer) {
      const game = key.split(":")[0];
      const stats = gameStats.get(game) ?? { players: 0, returned: 0 };
      stats.players += 1;
      if (value.returned) stats.returned += 1;
      gameStats.set(game, stats);
    }

    const r = retention[0];
    return NextResponse.json({
      allowed: true,
      days,
      timezone: tz,
      report: {
        grid,
        best,
        channels: channels.map((row) => ({ id: row.channel_id, messages: n(row.m) })),
        activeNow: n(active[0]?.now_),
        activeBefore: n(active[0]?.before_),
        avgDaily: inPeriod.reduce((sum, day) => sum + day.active, 0) / days,
        messages: inPeriod.reduce((sum, day) => sum + day.messages, 0),
        voiceMinutes: inPeriod.reduce((sum, day) => sum + day.voiceMinutes, 0),
        joined: n(r?.joined),
        left: n(r?.left_),
        cohort: n(r?.cohort),
        talked: n(r?.talked),
        stayed: n(r?.stayed),
        daily: series,
        games: [...gameStats.entries()]
          .map(([key, stats]) => ({ key, name: gameName(key), ...stats, plays: playsByGame.get(key) ?? 0 }))
          .sort((a, b) => b.players - a.players),
        trackingSince: since[0]?.since ? isoDay(new Date(since[0].since)) : null,
      },
    });
  } catch (error) {
    return serverError("load insights", error);
  }
}
