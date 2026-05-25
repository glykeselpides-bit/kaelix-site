import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  DataTable,
  LoadError,
  MetricGrid,
  formatDashboardDate,
} from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ActivitySession = {
  type: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
};

type ActivitiesData = {
  metrics: {
    activeActivitiesCount: number;
    totalSessions: number;
    trackedActivityTypes: number;
  };
  recentSessions: ActivitySession[];
};

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = await fetchServerSection<ActivitiesData>(guildId, "activities");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Activities"
      description="Manage activities, challenges, and engagement systems."
    >
      {data ? (
        <div className="space-y-6">
          <MetricGrid
            metrics={[
              {
                label: "Active Activities",
                value: data.metrics.activeActivitiesCount,
              },
              { label: "Total Sessions", value: data.metrics.totalSessions },
              {
                label: "Tracked Types",
                value: data.metrics.trackedActivityTypes,
                note: "Caption This, Cipher, Hidden Word, Story Chain, and Trivia sessions.",
              },
            ]}
          />

          <DataTable
            emptyText="No recent activity sessions found for this server yet."
            items={data.recentSessions}
            columns={[
              {
                key: "type",
                label: "Activity",
                render: (session) => session.type,
              },
              {
                key: "status",
                label: "Status",
                render: (session) => session.status,
              },
              {
                key: "startedAt",
                label: "Started At",
                render: (session) => formatDashboardDate(session.startedAt),
              },
              {
                key: "endedAt",
                label: "Ended At",
                render: (session) => formatDashboardDate(session.endedAt),
              },
            ]}
          />
        </div>
      ) : (
        <LoadError label="server activities" />
      )}
    </ServerSectionPlaceholder>
  );
}
