export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/kx_Logo.png"
              alt="Kaelix Logo"
              className="h-8 w-8 object-contain"
            />

            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-200">
              Kaelix
            </span>
          </div>

          <p className="mt-2 max-w-sm text-[10px] leading-6 text-slate-400">
            Premium Discord community infrastructure focused on engagement,
            progression, onboarding, automation, and activities.
          </p>
        </div>

        <div className="text-sm text-slate-400">
          <a
            href="mailto:hello@joinkaelix.com"
            className="transition hover:text-white"
          >
            Contact
          </a>
        </div>
      </div>

      <div className="border-t border-white/5 py-2 text-center text-[10px] tracking-[0.25em] text-slate-500">
        © 2026 Kaelix
      </div>
    </footer>
  );
}