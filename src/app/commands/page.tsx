import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CommandsPage() {
  const categories = [
    {
      title: "Community",
      commands: [
        {
          name: "/profile",
          description: "Open a Kaelix member profile.",
          tags: ["Member", "Free"],
        },
        {
          name: "/faction",
          description: "View your faction profile and identity.",
          tags: ["Member", "Free"],
        },
        {
          name: "/factionleaderboard",
          description: "View faction standings by total points.",
          tags: ["Member", "Free"],
        },
        {
          name: "/notifications",
          description: "Manage Kaelix notification preferences.",
          tags: ["Member", "Core+"],
        },
      ],
    },

    {
      title: "Progression",
      commands: [
        {
          name: "/points",
          description: "Check your progression points.",
          tags: ["Member", "Free"],
        },
        {
          name: "/level",
          description: "View your Kaelix level.",
          tags: ["Member", "Free"],
        },
        {
          name: "/leaderboard",
          description: "Browse server rankings and activity.",
          tags: ["Member", "Free"],
        },
        {
          name: "/transactions",
          description: "View recent point transactions.",
          tags: ["Member", "Pro+"],
        },
      ],
    },

    {
      title: "Events & Activities",
      commands: [
        {
          name: "/events",
          description: "Browse upcoming community events.",
          tags: ["Member", "Free"],
        },
        {
          name: "/register",
          description: "Register for an event.",
          tags: ["Member", "Free"],
        },
        {
          name: "/activities",
          description: "Browse and launch activities.",
          tags: ["Member", "Free"],
        },
        {
          name: "/eventinfo",
          description: "View detailed information about an event.",
          tags: ["Admin", "Core+"],
        },
      ],
    },

    {
      title: "Economy",
      commands: [
        {
          name: "/shop",
          description: "Browse the Kaelix shop.",
          tags: ["Member", "Pro+"],
        },
        {
          name: "/buyitem",
          description: "Purchase an item from the shop.",
          tags: ["Member", "Pro+"],
        },
        {
          name: "/inventory",
          description: "View your inventory.",
          tags: ["Member", "Pro+"],
        },
        {
          name: "/useitem",
          description: "Use an item from your inventory.",
          tags: ["Member", "Pro+"],
        },
      ],
    },

    {
      title: "Moderation & Community Tools",
      commands: [
        { name: "/mod", description: "Warn, timeout, kick, ban, unban and purge, with a saved case for every action.", tags: ["Admin", "Free"] },
        { name: "/automod", description: "Block spam, mass mentions and invites (Free); banned words, links and auto-timeouts (Core+).", tags: ["Admin", "Free"] },
        { name: "/welcome", description: "Welcome and leave messages; image cards on Core+.", tags: ["Admin", "Free"] },
        { name: "/poll", description: "Button polls. Free: 2 active; Core+: unlimited with multiple choice.", tags: ["Admin", "Free"] },
        { name: "/giveaway", description: "Giveaways with entry rules (Core+) and point entries (Pro+).", tags: ["Admin", "Free"] },
        { name: "/customcommand", description: "Your server's own !commands. Core: 2, Pro+: unlimited with role actions.", tags: ["Admin", "Core+"] },
        { name: "/autoresponder", description: "Automatic replies when someone says a trigger word.", tags: ["Admin", "Core+"] },
      ],
    },

    {
      title: "Pro Systems",
      commands: [
        { name: "/leveling", description: "Level role rewards, XP boosts, level-up messages and anti-farming.", tags: ["Admin", "Pro+"] },
        { name: "/season", description: "Faction Seasons: timed faction wars with a Hall of Fame.", tags: ["Admin", "Pro+"] },
        { name: "/autopilot", description: "Run any game automatically on a daily or weekly schedule.", tags: ["Admin", "Pro+"] },
        { name: "/alerts", description: "Twitch and Kick live alerts, YouTube upload alerts.", tags: ["Admin", "Pro+"] },
        { name: "/insights", description: "Best times to host, busiest channels, retention and which games bring people back.", tags: ["Admin", "Pro+"] },
      ],
    },

    {
      title: "Elite Systems",
      commands: [
        { name: "/network", description: "Link up with other Elite servers and compete in network seasons.", tags: ["Admin", "Elite"] },
        { name: "/trivianight", description: "Live head-to-head trivia battles across your network.", tags: ["Admin", "Elite"] },
        { name: "/tournament", description: "Knockout brackets between factions or servers.", tags: ["Admin", "Elite"] },
        { name: "/game", description: "Build and run your own games.", tags: ["Admin", "Elite"] },
        { name: "/automation", description: "When something happens, do something automatically.", tags: ["Admin", "Elite"] },
        { name: "/branding", description: "Kaelix's name, avatar, banner and bio in your server.", tags: ["Admin", "Elite"] },
      ],
    },

    {
      title: "Administration",
      commands: [
        {
          name: "/setup",
          description: "Launch the Kaelix setup wizard.",
          tags: ["Admin", "Free"],
        },
        {
          name: "/settings",
          description: "Manage server-wide Kaelix systems.",
          tags: ["Admin", "Core+"],
        },
        {
          name: "/analytics",
          description: "Open engagement analytics overview.",
          tags: ["Admin", "Pro+"],
        },
        {
          name: "/attend",
          description: "Mark users as attended for events.",
          tags: ["Admin", "Core+"],
        },
        {
          name: "/addpoints",
          description: "Add progression points to a user.",
          tags: ["Admin", "Core+"],
        },
        {
          name: "/removepoints",
          description: "Remove progression points from a user.",
          tags: ["Admin", "Core+"],
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
        <Navbar />

        <div className="min-h-screen bg-black/70 px-6 py-32">
        <div className="mx-auto max-w-7xl">
            
          <div className="mb-20 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
              Kaelix Systems
            </p>

            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Commands & Infrastructure
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
              Kaelix combines onboarding, progression, activities,
              analytics, automation, and community infrastructure into
              one unified Discord platform.
            </p>
          </div>

          <div className="space-y-16">
            {categories.map((category) => (
              <section key={category.title}>
                <div className="mb-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />

                  <h2 className="text-2xl font-bold text-white">
                    {category.title}
                  </h2>

                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {category.commands.map((command) => (
                    <div
                      key={command.name}
                      className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition hover:border-blue-400/30 hover:bg-blue-500/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-2xl font-bold text-blue-300">
                          {command.name}
                        </h3>

                        <div className="flex flex-wrap justify-end gap-2">
                          {command.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="mt-4 text-slate-300">
                        {command.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
     <Footer />
   </main>
  );
}