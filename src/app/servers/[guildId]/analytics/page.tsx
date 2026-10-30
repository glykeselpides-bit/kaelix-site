import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  LoadError,
  MetricGrid,
} from "@/components/ServerReadOnlySection";
import Link from "next/link";
import { fetchServerSection } from "@/lib/dashboardFetch";
import { featurePlanName, planHasFeature } from "@/lib/planLimits";
import { getPrisma } from "@/lib/prisma";
import { getServerPlan } from "@/lib/serverPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnalyticsData = {
  metrics: {
    trackedUsers: number;
    totalPoints: number;
    eventsCount: number;
    factionsCount: number;
    participationCount: number;
    pointTransactionsCount: number;
  };
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  // Analytics is a Pro feature. If the plan can't be read, show the page
  // and let the API decide.
  let locked = false;
  try {
    const { plan } = await getServerPlan(getPrisma(), BigInt(guildId));
    locked = !planHasFeature(plan, "analytics");
  } catch {
    locked = false;
  }

  if (locked) {
    return (
      <ServerSectionPlaceholder
        params={params}
        title="Analytics"
        description="View and analyze server performance, user engagement, and system metrics."
      >
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-6">
          <p className="font-bold text-amber-100">
            {"\u{1F512}"} Analytics is included from the {featurePlanName("analytics")} plan.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Upgrade this server to see member, points, events and faction
            analytics here and with /analytics in Discord.
          </p>
          <Link
            href={`/checkout?guildId=${guildId}&plan=pro`}
            className="mt-5 inline-flex rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400"
          >
            See plans
          </Link>
        </div>
      </ServerSectionPlaceholder>
    );
  }

  const data = await fetchServerSection<AnalyticsData>(guildId, "analytics");
  const metrics = data?.metrics;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Analytics"
      description="View and analyze server performance, user engagement, and system metrics."
    >
      {metrics ? (
        <div className="space-y-5">
          <MetricGrid
            metrics={[
              { label: "Tracked Users", value: metrics.trackedUsers },
              { label: "Total Points", value: metrics.totalPoints },
              { label: "Events Hosted", value: metrics.eventsCount },
              { label: "Active Factions", value: metrics.factionsCount },
              {
                label: "Activity Sessions",
                value: metrics.participationCount,
              },
              {
                label: "Point Transactions",
                value: metrics.pointTransactionsCount,
              },
            ]}
          />
        </div>
      ) : (
        <LoadError label="server analytics" />
      )}
    </ServerSectionPlaceholder>
  );
}
