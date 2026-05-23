import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PoweredByKaelixPage() {
  const projects = [
    {
      name: "Activity Hub",
      description:
        "A fully interactive activity ecosystem with games, quizzes, events, progression, and competitive systems.",
      status: "In Development",
    },
    {
      name: "Kaelix Analytics",
      description:
        "Advanced server insights, participation tracking, engagement heatmaps, and growth analytics.",
      status: "Planned",
    },
    {
      name: "Automation Suite",
      description:
        "Powerful automation tools for onboarding, moderation, scheduling, role systems, and workflows.",
      status: "Planned",
    },
    {
      name: "Kaelix Web Dashboard",
      description:
        "A full management dashboard for configuring and controlling your community outside Discord.",
      status: "In Progress",
    },
  ];

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">
            Powered by Kaelix
          </p>

          <h1 className="mb-6 text-5xl font-black tracking-tight sm:text-6xl">
            Expanding the Kaelix ecosystem.
          </h1>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">
            Kaelix is evolving beyond a single Discord bot into a growing
            ecosystem of systems, tools, analytics, automation, and community
            infrastructure.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.name}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">{project.name}</h2>

                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                  {project.status}
                </span>
              </div>

              <p className="leading-relaxed text-slate-400">
                {project.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}