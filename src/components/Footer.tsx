export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-5 text-center">
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

        <p className="mt-3 max-w-xl text-xs leading-6 text-slate-400">
          Premium Discord community infrastructure focused on engagement,
          progression, onboarding, automation, and activities.
        </p>

        <a
          href="mailto:hello@joinkaelix.com"
          className="mt-4 text-sm text-slate-400 transition hover:text-white"
        >
          hello@joinkaelix.com
        </a>

        <div className="mt-5 text-[10px] tracking-[0.25em] text-slate-500">
          © 2026 Kaelix
        </div>
      </div>
    </footer>
  );
}