import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ServerDashboardPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guildIdBigInt = BigInt(guildId);

  const [config, subscription, eventsCount, factionsCount, usersCount, totalPoints] =
    await Promise.all([
      prisma.guild_config.findUnique({
        where: { guild_id: guildIdBigInt },
      }),

      prisma.guild_subscriptions.findUnique({
        where: { guild_id: guildIdBigInt },
      }),

      prisma.events.count({
        where: { guild_id: guildIdBigInt },
      }),

      prisma.factions.count({
        where: { guild_id: guildIdBigInt },
      }),

      prisma.user_points.count({
        where: { guild_id: guildIdBigInt },
      }),

      prisma.user_points.aggregate({
        where: { guild_id: guildIdBigInt },
        _sum: { points: true },
      }),
    ]);

  const stats = [
    {
      label: "Plan",
      value: subscription?.plan ?? "Free / Not set",
    },
    {
      label: "Status",
      value: subscription?.status ?? "Active / Not set",
    },
    {
      label: "Events",
      value: eventsCount,
    },
    {
      label: "Factions",
      value: factionsCount,
    },
    {
      label: "Tracked Users",
      value: usersCount,
    },
    {
      label: "Total Points",
      value: totalPoints._sum.points ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/70">
        <Navbar />

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-36">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
            Server Dashboard
          </p>

          <h1 className="mt-5 text-5xl font-bold md:text-6xl">
            Manage Server
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Live Kaelix data from your server database.
          </p>

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

                <div className="mt-4 text-3xl font-bold text-white">
                  {String(stat.value)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">Configuration</h2>

            <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
              <p>Activities: {config?.enable_activities ? "Enabled" : "Disabled"}</p>
              <p>Achievements: {config?.enable_achievements ? "Enabled" : "Disabled"}</p>
              <p>Onboarding: {config?.onboarding_enabled ? "Enabled" : "Disabled"}</p>
              <p>Weekly Summary: {config?.weekly_summary_enabled ? "Enabled" : "Disabled"}</p>
              <p>DM Notifications: {config?.send_dm_notifications ? "Enabled" : "Disabled"}</p>
              <p>Event Points: {config?.enable_event_points ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}