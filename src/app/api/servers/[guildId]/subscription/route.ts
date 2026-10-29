import { NextResponse } from "next/server";
import { formatDate, invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

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
    const plan = await getServerPlan(prisma, guildIdBigInt);

    return NextResponse.json({
      found: true,
      subscription: {
        plan: plan.planLabel,
        planId: plan.plan,
        source: plan.source,
        status: plan.status,
        billedThrough: plan.billedThrough,
        trialUsed: plan.trialUsed,
        trialEndsAt: formatDate(plan.trialEndsAt),
        currentPeriodEnd: formatDate(plan.currentPeriodEnd),
        accessEndsAt: formatDate(plan.accessEndsAt),
        cancelAtPeriodEnd: plan.cancelAtPeriodEnd,
        billingActive: plan.source === "discord" || plan.source === "subscription",
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