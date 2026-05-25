import Link from "next/link";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const navigation = [
  { title: "Overview", href: "" },
  { title: "Settings", href: "settings" },
  { title: "Events", href: "events" },
  { title: "Factions", href: "factions" },
  { title: "Activities", href: "activities" },
  { title: "Onboarding", href: "onboarding" },
  { title: "Logs", href: "logs" },
  { title: "Analytics", href: "analytics" },
  { title: "Subscription", href: "subscription" },
];

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/75">
        <Navbar />

        <div className="mx-auto flex max-w-7xl gap-8 px-6 pb-24 pt-32">
          <aside className="sticky top-32 hidden h-fit w-72 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-300">
              Kaelix
            </p>

            <h2 className="mt-4 text-2xl font-bold">Server Panel</h2>

            <div className="mt-8 flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.title}
                  href={
                    item.href
                      ? `/servers/${guildId}/${item.href}`
                      : `/servers/${guildId}`
                  }
                  className="rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </aside>

          <div className="flex-1">{children}</div>
        </div>
      </div>
    </main>
  );
}