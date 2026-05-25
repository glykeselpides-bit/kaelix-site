import Link from "next/link";
import { fetchServerSection } from "@/lib/dashboardFetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OverviewMetrics = {
  trackedUsers: number;
  totalPoints: number;
  eventsHosted: number;
  activeFactions: number;
  activitiesPlayed: number;
  weeklyEngagement: number | null;
};

type OverviewResponse = {
  metrics: OverviewMetrics;
};

const numberFormatter = new Intl.NumberFormat("en-GB");

function formatMetric(value: number | null | undefined) {
  return typeof value === "number" ? numberFormatter.format(value) : "--";
}

export default async function ServerDashboardPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const overview = await fetchServerSection<OverviewResponse>(
    guildId,
    "overview"
  );
  const metrics = overview?.metrics;
  const hasLiveMetrics = Boolean(metrics);
  const serverPath = `/servers/${guildId}`;

  const stats = [
    {
      label: "Members Tracked",
      value: formatMetric(metrics?.trackedUsers),
      href: `${serverPath}/analytics`,
      detail: "Open analytics",
    },
    {
      label: "Total Points",
      value: formatMetric(metrics?.totalPoints),
      href: `${serverPath}/analytics`,
      detail: "Review point totals",
    },
    {
      label: "Events Hosted",
      value: formatMetric(metrics?.eventsHosted),
      href: `${serverPath}/events`,
      detail: "Manage events",
    },
    {
      label: "Active Factions",
      value: formatMetric(metrics?.activeFactions),
      href: `${serverPath}/factions`,
      detail: "View factions",
    },
    {
      label: "Activities Played",
      value: formatMetric(metrics?.activitiesPlayed),
      href: `${serverPath}/activities`,
      detail: "Check activity systems",
    },
    {
      label: "Weekly Engagement",
      value:
        metrics?.weeklyEngagement === null
          ? "Coming soon"
          : formatMetric(metrics?.weeklyEngagement),
      href: `${serverPath}/analytics`,
      detail: "Inspect engagement",
    },
  ];

  const nextSteps = [
    {
      title: "Configure server",
      href: `${serverPath}/settings`,
      description: "Confirm channels, permissions, and core Kaelix behaviour.",
    },
    {
      title: "Review events",
      href: `${serverPath}/events`,
      description: "Check upcoming events, rewards, statuses, and attendance.",
    },
    {
      title: "Check activity systems",
      href: `${serverPath}/activities`,
      description: "Validate activity tracking and participation data.",
    },
  ];

  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
        Server Dashboard
      </p>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-bold md:text-6xl">Manage Server</h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Control Kaelix systems, settings, activity tools, factions,
            onboarding, analytics, and subscriptions from one place.
          </p>
        </div>

        <div className="rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
          Connected
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-slate-400">
          Server ID: <span className="text-slate-200">{guildId}</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
          Metrics:{" "}
          <span className={hasLiveMetrics ? "text-blue-200" : "text-amber-200"}>
            {hasLiveMetrics ? "Live" : "Fallback"}
          </span>
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-500/10"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
                {stat.label}
              </p>

              <span className="text-sm text-slate-500 transition group-hover:text-blue-200">
                View
              </span>
            </div>

            <div className="mt-4 text-2xl font-bold text-white">
              {stat.value}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              {stat.detail}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
              Operations
            </p>

            <h2 className="mt-3 text-3xl font-bold">Kaelix Status</h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-400">
            A quick pulse check for the systems powering this server dashboard.
          </p>
        </div>

        <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2 lg:grid-cols-3">
          <p>Bot: Connected</p>
          <p>Database: Connected</p>
          <p>Dashboard: Online</p>
          <p>Activities: Ready</p>
          <p>Weekly Digest: Coming soon</p>
          <p>Notifications: Coming soon</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
              Next Steps
            </p>

            <h2 className="mt-3 text-3xl font-bold">Keep Building Momentum</h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Jump into the highest-impact areas for keeping Kaelix tuned and
            useful for your community.
          </p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {nextSteps.map((step) => (
            <Link
              href={step.href}
              key={step.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-left transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-500/10"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-white">{step.title}</h3>

                <span className="text-sm font-semibold text-blue-200">
                  Open
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                {step.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
