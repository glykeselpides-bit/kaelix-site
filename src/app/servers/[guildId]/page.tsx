import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ServerDashboardPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  const stats = [
    { label: "Members Tracked", value: "—" },
    { label: "Total Points", value: "—" },
    { label: "Events Hosted", value: "—" },
    { label: "Active Factions", value: "—" },
    { label: "Activities Played", value: "—" },
    { label: "Weekly Engagement", value: "—" },
  ];

  const actions = [
  {
    title: "Settings",
    href: `/servers/${guildId}/settings`,
  },
  {
    title: "Events",
    href: `/servers/${guildId}/events`,
  },
  {
    title: "Factions",
    href: `/servers/${guildId}/factions`,
  },
  {
    title: "Activities",
    href: `/servers/${guildId}/activities`,
  },
  {
    title: "Onboarding",
    href: `/servers/${guildId}/onboarding`,
  },
  {
    title: "Logs",
    href: `/servers/${guildId}/logs`,
  },
  {
    title: "Analytics",
    href: `/servers/${guildId}/analytics`,
  },
  {
    title: "Subscription",
    href: `/servers/${guildId}/subscription`,
  },
];

  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/70">
        <Navbar />

        <section className="mx-auto max-w-7xl px-6 pb-24 pt-36">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
            Server Dashboard
          </p>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-5xl font-bold md:text-6xl">
                Manage Server
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Control Kaelix systems, settings, activity tools, factions,
                onboarding, analytics, and subscriptions from one place.
              </p>
            </div>

            <div className="rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
              Connected
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-slate-400">
            Server ID: <span className="text-slate-200">{guildId}</span>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
                  {stat.label}
                </p>

                <div className="mt-4 text-2xl font-bold text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-3xl font-bold">Quick Actions</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {actions.map((action) => (
                <Link
                  href={action.href}
                  key={action.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-left text-lg font-bold text-white transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-500/10"
                >
                  {action.title}

                  <p className="mt-3 text-sm font-normal leading-6 text-slate-400">
                    {action.title} tools are coming soon.
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold">Kaelix Status</h2>

            <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2 lg:grid-cols-3">
              <p>Bot: Connected</p>
              <p>Database: Connected</p>
              <p>Dashboard: Online</p>
              <p>Activities: Coming soon</p>
              <p>Weekly Digest: Coming soon</p>
              <p>Notifications: Coming soon</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}