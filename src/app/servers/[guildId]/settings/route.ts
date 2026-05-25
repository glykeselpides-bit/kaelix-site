import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  const config = await prisma.guild_config.findUnique({
    where: {
      guild_id: BigInt(guildId),
    },
  });

  if (!config) {
    return NextResponse.json({
      found: false,
      message: "No settings found for this server yet.",
    });
  }

  return NextResponse.json({
    found: true,
    settings: {
      activities: config.enable_activities,
      achievements: config.enable_achievements,
      onboarding: config.onboarding_enabled,
      weeklySummary: config.weekly_summary_enabled,
      dmNotifications: config.send_dm_notifications,
      eventPoints: config.enable_event_points,
      messagePoints: config.enable_message_points,
      reactionPoints: config.enable_reaction_points,
      voicePoints: config.enable_voice_points,
      defaultEventPoints: config.default_event_points,
      pointsPerMessage: config.points_per_message,
      pointsPerReaction: config.points_per_reaction,
      weeklySummaryDay: config.weekly_summary_day,
      weeklySummaryHour: config.weekly_summary_hour,
      weeklySummaryMinute: config.weekly_summary_minute,
    },
  });
}