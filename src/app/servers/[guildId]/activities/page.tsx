import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  DataTable,
  MetricGrid,
  formatDashboardDate,
} from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import ActivitiesManager, { type ActivitySetting } from "./ActivitiesManager";

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
    configuredActivityTypes: number;
    enabledActivityTypes: number;
  };
  activities: ActivitySetting[];
  recentSessions: ActivitySession[];
  warnings?: string[];
};

const fallbackActivitiesData: ActivitiesData = {
  metrics: {
    activeActivitiesCount: 0,
    totalSessions: 0,
    trackedActivityTypes: 0,
    configuredActivityTypes: 0,
    enabledActivityTypes: 0,
  },
  activities: [],
  recentSessions: [],
  warnings: ["Activities could not be loaded."],
};

function normalizeActivitiesData(data: ActivitiesData | null): ActivitiesData {
  if (!data || typeof data !== "object") {
    return fallbackActivitiesData;
  }

  const metrics = data.metrics ?? fallbackActivitiesData.metrics;

  return {
    metrics: {
      activeActivitiesCount: Number.isFinite(metrics.activeActivitiesCount)
        ? metrics.activeActivitiesCount
        : 0,
      totalSessions: Number.isFinite(metrics.totalSessions)
        ? metrics.totalSessions
        : 0,
      trackedActivityTypes: Number.isFinite(metrics.trackedActivityTypes)
        ? metrics.trackedActivityTypes
        : 0,
      configuredActivityTypes: Number.isFinite(metrics.configuredActivityTypes)
        ? metrics.configuredActivityTypes
        : 0,
      enabledActivityTypes: Number.isFinite(metrics.enabledActivityTypes)
        ? metrics.enabledActivityTypes
        : 0,
    },
    activities: Array.isArray(data.activities) ? data.activities : [],
    recentSessions: Array.isArray(data.recentSessions)
      ? data.recentSessions
      : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
}

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = normalizeActivitiesData(
    await fetchServerSection<ActivitiesData>(guildId, "activities")
  );

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Activities"
      description="Manage activities, challenges, and engagement systems."
    >
      <div className="space-y-6">
          {data.warnings?.length ? (
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">
              {data.warnings[0]}
            </div>
          ) : null}

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
                note: `${data.metrics.enabledActivityTypes} enabled / ${data.metrics.configuredActivityTypes} configured.`,
              },
            ]}
          />

          <ActivitiesManager
            guildId={guildId}
            initialActivities={data.activities}
            loadError={Boolean(data.warnings?.length)}
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
    </ServerSectionPlaceholder>
  );
}
