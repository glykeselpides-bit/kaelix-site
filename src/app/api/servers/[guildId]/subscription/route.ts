import { NextResponse } from "next/server";
import { formatDate, invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";
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
    const subscription = await prisma.guild_subscriptions.findUnique({
      where: { guild_id: guildIdBigInt },
    });

    return NextResponse.json({
      found: Boolean(subscription),
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            trialUsed: subscription.trial_used,
            trialEndsAt: formatDate(subscription.trial_ends_at),
            currentPeriodEnd: formatDate(subscription.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        : {
            plan: "Free / Not set",
            status: "Not set",
            trialUsed: false,
            trialEndsAt: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
    });
  } catch (error) {
    console.error("Failed to load server subscription", error);

    return NextResponse.json(
      { error: "Failed to load server subscription" },
      { status: 500 }
    );
  }
}
