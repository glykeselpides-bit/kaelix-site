import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AddOnsPage() {
  const addOns = [
    {
      name: "Premium Setup",
      description:
        "Hands-on setup support for communities that want Kaelix configured properly from day one.",
      status: "Coming Soon",
    },
    {
      name: "Advanced Analytics",
      description:
        "Deeper server insights, engagement reports, activity trends, and participation breakdowns.",
      status: "Planned",
    },
    {
      name: "Custom Automation",
      description:
        "Extra workflows, custom reminders, role logic, and server-specific automation systems.",
      status: "Planned",
    },
    {
      name: "Custom Visuals",
      description:
        "Branded leaderboard cards, summary images, faction visuals, and premium server graphics.",
      status: "Planned",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-6xl">
          <section className="mb-16 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">
              Add-ons
            </p>

            <h1 className="mb-6 text-5xl font-black tracking-tight sm:text-6xl">
              Extra power when you need it.
            </h1>

            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">
              Optional upgrades for communities that want more control,
              customization, automation, visuals, or hands-on support beyond the
              standard Kaelix tiers.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            {addOns.map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">{item.name}</h2>

                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                    {item.status}
                  </span>
                </div>

                <p className="leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}