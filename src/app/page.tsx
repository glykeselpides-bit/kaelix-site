import Footer from "@/components/Footer";

export default function Home() {
  const inviteUrl =
    "https://discord.com/oauth2/authorize?client_id=1506753052173139968&permissions=8&integration_type=0&scope=bot+applications.commands";

  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/25">
        <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/35 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <a
              href="#"
              className="flex items-center gap-3 transition hover:opacity-80"
            >
              <img src="/kx_Logo.png" alt="Kaelix Logo" className="h-10 w-10 object-contain" />

              <span className="text-base font-semibold uppercase tracking-[0.35em] text-slate-200">
                Kaelix
              </span>
            </a>

            <div className="hidden items-center gap-8 text-sm text-slate-300 lg:flex">
              <a className="transition hover:text-white" href="#features">Features</a>
              <a className="transition hover:text-white" href="#preview">Preview</a>
              <a className="transition hover:text-white" href="#pricing">Pricing</a>
              <a className="transition hover:text-white" href="#community">Community</a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-xl border border-blue-400/50 bg-blue-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-900/80 md:block"
              >
                Add to Discord
              </a>

              <details className="relative">
                <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white">
                  ☰
                </summary>

                <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl">
                  <a
                    href="/commands"
                    className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Commands
                  </a>

                  <a
                    href="/pricing"
                    className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Pricing
                  </a>

                  <a
                    href="/docs"
                    className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Docs
                  </a>

                  <a
                    href="/dashboard"
                    className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Dashboard
                  </a>

                  <a
                    href="/status"
                    className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Status
                  </a>

                  <a
                    href="https://discord.gg/2PYbjwmHRX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-4 text-sm text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
                  >
                    Community
                  </a>
                </div>
              </details>
            </div>
          </div>
        </nav>

        <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
          <img
            src="/kx_Logo.png"
            alt="Kaelix Logo"
            className="mb-8 h-24 w-24 object-contain"
          />

          <p className="mb-6 text-base font-semibold uppercase tracking-[0.25em] text-slate-200">
            KAELIX
          </p>

          <h1 className="max-w-4xl text-2xl font-bold leading-tight sm:text-3xl md:text-5xl">
            The Operating System
            <span className="block text-slate-200">for Modern Communities</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
            Events. Factions. Points. Activities. Automation.
            <br />
            Everything your community needs in one system.
          </p>

          <div className="mt-8 rounded-full border border-blue-400/30 bg-black/40 px-5 py-2 text-sm text-slate-300 backdrop-blur">
            Built for <span className="text-blue-400">Discord</span> communities.
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-blue-400/60 bg-blue-950/80 px-8 py-4 text-lg font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-900"
            >
              Add to Discord
            </a>

            <a
              href="https://discord.gg/2PYbjwmHRX"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-white/20 bg-black/30 px-8 py-4 text-lg font-semibold backdrop-blur transition hover:border-blue-400 hover:text-blue-300"
            >
              Join Community
            </a>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-blue-300">
              Features
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              Built to manage serious communities.
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {[
              ["Events", "Create, register, attend, remind, and track community events."],
              ["Factions", "Sort members into factions with onboarding and role flows."],
              ["Points", "Reward activity, attendance, wins, and contribution."],
              ["Activities", "Run quizzes, ciphers, games, and community challenges."],
              ["Summaries", "Generate weekly reports and server activity snapshots."],
              ["Automation", "Reduce admin work with structured community systems."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-black/50"
              >
                <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
                <p className="text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["24/7", "Community automation"],
              ["Unlimited", "Faction possibilities"],
              ["One System", "For events, points, and activities"],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-black/35 p-10 text-center shadow-[0_0_40px_rgba(37,99,235,0.08)] backdrop-blur-xl"
              >
                <h3 className="text-5xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="preview" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-blue-300">
              Product Preview
            </p>

            <h2 className="text-3xl font-bold md:text-5xl">
              See Kaelix in action.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-slate-400">
              Built directly inside Discord with a premium native experience.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              ["/preview-onboarding.png", "Kaelix Onboarding"],
              ["/preview-admin-hub.jpeg", "Kaelix Admin Hub"],
              ["/preview-activity-categories.jpeg", "Kaelix Activities"],
              ["/preview-analytics.jpeg", "Kaelix Analytics"],
            ].map(([src, alt]) => (
              <div
                key={src}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl transition hover:border-blue-400/30"
              >
                <img
                  src={src}
                  alt={alt}
                  className="h-[240px] w-full object-cover object-top transition duration-500 hover:scale-[1.03] sm:h-[320px] md:h-[420px]"
                />
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
              Pricing
            </p>

            <h2 className="mt-5 text-4xl font-bold text-white md:text-6xl">
              Flexible plans for every community.
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Start free and scale with advanced systems, analytics,
              automation, activities, and premium community infrastructure.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-black/50 p-8 backdrop-blur-xl transition hover:-translate-y-2 hover:border-blue-400/40">
              <h3 className="text-3xl font-bold text-white">
                Free
              </h3>

              <p className="mt-4 text-slate-300">
                Perfect for smaller communities getting started with Kaelix.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>• Up to 60 members</li>
                <li>• Events & onboarding</li>
                <li>• Starter activities</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-blue-400/40 bg-blue-500/10 p-8 shadow-[0_0_30px_rgba(59,130,246,0.12)] backdrop-blur-xl transition hover:-translate-y-2">
              <div className="mb-4 inline-flex rounded-full border border-blue-400/40 bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                Most Popular
              </div>

              <h3 className="text-3xl font-bold text-white">
                Core
              </h3>

              <p className="mt-4 text-slate-300">
                Built for active communities that need structure and engagement.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>• Weekly summaries</li>
                <li>• DM notifications</li>
                <li>• Expanded activities</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/50 p-8 backdrop-blur-xl transition hover:-translate-y-2 hover:border-blue-400/40">
              <h3 className="text-3xl font-bold text-white">
                Pro
              </h3>

              <p className="mt-4 text-slate-300">
                Advanced systems for larger and highly active communities.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>• Analytics & progression</li>
                <li>• Full activity library</li>
                <li>• Advanced faction systems</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href="/pricing"
              className="inline-flex rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:scale-[1.03] hover:bg-blue-500"
            >
              View Plans
            </a>
          </div>
        </section>

        <section
          id="community"
          className="mx-auto max-w-5xl px-6 py-12"
        >
          <div className="rounded-[32px] border border-blue-500/20 bg-black/70 px-8 py-14 text-center backdrop-blur-xl md:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-blue-300">
              READY TO LAUNCH
            </p>

            <h2 className="mt-5 text-3xl font-bold text-white md:text-5xl">
              Build a better community.
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Kaelix gives modern Discord communities structured systems,
              automation, onboarding, analytics, activities, and progression —
              all in one platform.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://discord.com/oauth2/authorize?client_id=1506753052173139968&permissions=8&integration_type=0&scope=bot+applications.commands"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:scale-[1.03] hover:bg-blue-500"
              >
                Add to Discord
              </a>

              <a
                href="https://discord.gg/2PYbjwmHRX"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/10"
              >
                Join Community
              </a>
            </div>
          </div>
        </section>
        <footer className="border-t border-white/10 bg-black/40 px-6 py-8 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 text-left">
            <div className="flex items-center gap-4">
              <img
                src="/kx_Logo.png"
                alt="Kaelix Logo"
                className="h-10 w-10 object-contain"
              />

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-200">
                  Kaelix
                </p>

                <p className="text-sm text-slate-500">
                  Community infrastructure reimagined.
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-400">
              <a
                href="mailto:hello@joinkaelix.com"
                className="rounded-full border border-white/10 px-5 py-2 transition hover:border-blue-400/40 hover:text-white"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}