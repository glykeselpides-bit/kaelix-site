import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError, MetricGrid } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";

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
  const data = await fetchServerSection<AnalyticsData>(guildId, "analytics");
  const metrics = data?.metrics;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Analytics"
      description="View and analyze server performance, user engagement, and system metrics."
    >
      {metrics ? (
        <MetricGrid
          metrics={[
            { label: "Tracked Users", value: metrics.trackedUsers },
            { label: "Total Points", value: metrics.totalPoints },
            { label: "Events Count", value: metrics.eventsCount },
            { label: "Factions Count", value: metrics.factionsCount },
            {
              label: "Participation Count",
              value: metrics.participationCount,
            },
            {
              label: "Point Transactions",
              value: metrics.pointTransactionsCount,
            },
          ]}
        />
      ) : (
        <LoadError label="server analytics" />
      )}
    </ServerSectionPlaceholder>
  );
}
