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
      <div className="min-h-screen bg-black/70 px-6 py-24">
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
    </main>
  );
}