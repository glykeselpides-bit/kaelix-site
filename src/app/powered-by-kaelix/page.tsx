import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PoweredByKaelixPage() {
  const projects = [
    {
      name: "Coming Soon",
      type: "Bot",
      description:
        "New community tools and Discord bots built under the Kaelix brand will appear here.",
      status: "In Development",
    },
    {
      name: "Coming Soon",
      type: "Game",
      description:
        "Interactive games, server activities, and community experiences powered by the Kaelix ecosystem.",
      status: "Planned",
    },
    {
      name: "Coming Soon",
      type: "Tool",
      description:
        "Standalone tools, dashboards, and utilities created to support modern online communities.",
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
              Powered by Kaelix
            </p>

            <h1 className="mb-6 text-5xl font-black tracking-tight sm:text-6xl">
              Built under the Kaelix brand.
            </h1>

            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">
              A future home for bots, games, tools, and community systems
              created by our team and powered by the Kaelix ecosystem.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {projects.map((project, index) => (
              <div
                key={index}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {project.type}
                  </span>

                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                    {project.status}
                  </span>
                </div>

                <h2 className="mb-4 text-2xl font-bold">{project.name}</h2>

                <p className="leading-relaxed text-slate-400">
                  {project.description}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <h2 className="mb-4 text-3xl font-black">
              More projects are coming.
            </h2>

            <p className="mx-auto max-w-2xl text-slate-400">
              As the Kaelix brand grows, this page will showcase every product,
              experiment, bot, game, and system released by the team.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}