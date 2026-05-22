export default function Home() {
  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/25">
        <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/35 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <img src="/kx_Logo.png" alt="Kaelix Logo" className="h-10 w-10 object-contain" />
              <span className="text-base font-semibold uppercase tracking-[0.35em] text-slate-200">
                Kaelix
              </span>
            </div>

            <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a className="transition hover:text-white" href="#features">Features</a>
              <a className="transition hover:text-white" href="#pricing">Pricing</a>
              <a className="transition hover:text-white" href="#docs">Docs</a>
              <a className="transition hover:text-white" href="#login">Login</a>
            </div>

            <a
              href="https://discord.com/oauth2/authorize?client_id=1506753052173139968&permissions=8&integration_type=0&scope=bot+applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-xl border border-blue-400/50 bg-blue-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-900/80 md:block"
            >
              Add to Discord
            </a>
          </div>
        </nav>

        <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
          <img
            src="/kx_Logo.png"
            alt="Kaelix Logo"
            className="mb-8 h-30 w-30 object-contain"
          />

          <p className="mb-6 text-base font-semibold uppercase tracking-[0.25em] text-slate-200">
            KAELIX
          </p>

          <h1 className="max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
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

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://discord.com/oauth2/authorize?client_id=1506753052173139968&permissions=8&integration_type=0&scope=bot+applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-xl border border-blue-400/50 bg-blue-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-900/80 md:block"
            >
              Add to Discord
            </a>

            <button className="rounded-2xl border border-white/20 bg-black/30 px-8 py-4 text-lg font-semibold backdrop-blur transition hover:border-blue-400 hover:text-blue-300">
              Join Waitlist
            </button>
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

          <div className="grid gap-5 md:grid-cols-3">
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
        
        <section
          id="preview"
          className="mx-auto max-w-7xl px-6 py-24"
        >
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

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl">
              <img
                src="/preview-onboarding.jpeg"
                alt="Onboarding"
                className="h-[420px] w-full object-cover object-top transition duration-500 hover:scale-[1.03]"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl">
              <img
                src="/preview-admin-hub.jpeg"
                alt="Admin Hub"
                className="h-[420px] w-full object-cover object-top transition duration-500 hover:scale-[1.03]"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl">
              <img
                src="/preview-activity-hub.jpeg"
                alt="Activities"
                className="h-[420px] w-full object-cover object-top transition duration-500 hover:scale-[1.03]"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl">
              <img
                src="/preview-analytics.jpeg"
                alt="Analytics"
                className="h-[420px] w-full object-cover object-top transition duration-500 hover:scale-[1.03]"
              />
            </div>

          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-blue-300">
            Pricing
          </p>
          <h2 className="text-2xl font-bold md:text-3xl">
            Start free. Scale when ready.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Kaelix is being built for communities that want premium systems without messy command clutter.
          </p>

          <div className="mt-10 rounded-3xl border border-blue-400/30 bg-black/45 p-8 backdrop-blur-xl">
            <p className="text-2xl font-semibold">Pricing coming soon</p>
            <p className="mt-3 text-slate-400">
              Early access servers will be invited first.
            </p>
          </div>
        </section>
        <footer className="border-t border-white/10 bg-black/40 px-6 py-10 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            
            <div className="flex items-center gap-3">
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

            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="transition hover:text-white">
                Features
              </a>

              <a href="#" className="transition hover:text-white">
                Pricing
              </a>

              <a href="#" className="transition hover:text-white">
                Docs
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}