import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { MetricGrid } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import ActivitiesManager, { type ActivitySetting } from "./ActivitiesManager";
import ActivitySessionsManager, {
  type SessionsPayload,
} from "./ActivitySessionsManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ActivitiesData = {
  metrics: {
    activeActivitiesCount: number;
    totalSessions: number;
    trackedActivityTypes: number;
    configuredActivityTypes: number;
    enabledActivityTypes: number;
  };
  activities: ActivitySetting[];
  recentSessions?: unknown[];
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

const fallbackSessionsData: SessionsPayload = {
  activeSessions: [],
  recentSessions: [],
  sessions: [],
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
    recentSessions: Array.isArray(data.recentSessions) ? data.recentSessions : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
}

function normalizeSessionsData(data: SessionsPayload | null): SessionsPayload {
  if (!data || typeof data !== "object") {
    return fallbackSessionsData;
  }

  return {
    activeSessions: Array.isArray(data.activeSessions)
      ? data.activeSessions
      : Array.isArray(data.sessions)
        ? data.sessions
        : [],
    recentSessions: Array.isArray(data.recentSessions)
      ? data.recentSessions
      : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
}

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const [data, sessionsData] = await Promise.all([
    fetchServerSection<ActivitiesData>(guildId, "activities").then(
      normalizeActivitiesData
    ),
    fetchServerSection<SessionsPayload>(guildId, "activities/sessions").then(
      normalizeSessionsData
    ),
  ]);

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

        <ActivitySessionsManager
          guildId={guildId}
          initialPayload={sessionsData}
        />

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Content
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">Coming next</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {["Questions", "Riddles", "Prompts", "Word lists"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">
            Manage activity content such as trivia questions, riddles, prompts,
            and word lists from here.
          </p>
        </section>
      </div>
    </ServerSectionPlaceholder>
  );
}
