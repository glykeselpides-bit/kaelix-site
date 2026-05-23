export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/kx_Logo.png"
            alt="Kaelix Logo"
            className="h-7 w-7 object-contain"
          />

          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-200">
            Kaelix
          </span>
        </div>

        <a
          href="mailto:hello@joinkaelix.com"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-400/50 hover:bg-blue-500/10 hover:text-white"
        >
          Contact
        </a>
      </div>
    </footer>
  );
}