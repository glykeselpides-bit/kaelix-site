export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/kx_Logo.png"
              alt="Kaelix Logo"
              className="h-10 w-10 object-contain"
            />

            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-200">
              Kaelix
            </span>
          </div>

          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
            Premium Discord community infrastructure focused on engagement,
            progression, onboarding, automation, and activities.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 text-sm text-slate-400">
          <a href="/commands" className="transition hover:text-white">
            Commands
          </a>

          <a href="/pricing" className="transition hover:text-white">
            Pricing
          </a>

          <a href="/docs" className="transition hover:text-white">
            Docs
          </a>

          <a href="/status" className="transition hover:text-white">
            Status
          </a>

          <a
            href="https://discord.gg/2PYbjwmHRX"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
          >
            Community
          </a>
        </div>
      </div>

      <div className="border-t border-white/5 py-5 text-center text-xs tracking-[0.25em] text-slate-500">
        © 2026 KAELIX. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}