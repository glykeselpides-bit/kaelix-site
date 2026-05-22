export default function Navbar() {
  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a
          href="/"
          className="flex items-center gap-3 transition hover:opacity-80"
        >
          <img
            src="/kx_Logo.png"
            alt="Kaelix Logo"
            className="h-10 w-10 object-contain"
          />

          <span className="text-base font-semibold uppercase tracking-[0.35em] text-slate-200">
            Kaelix
          </span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-slate-300 lg:flex">
          <a className="transition hover:text-white" href="/#features">
            Features
          </a>

          <a className="transition hover:text-white" href="/#preview">
            Preview
          </a>

          <a className="transition hover:text-white" href="/#pricing">
            Pricing
          </a>

          <a className="transition hover:text-white" href="/commands">
            Commands
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="YOUR_DISCORD_INVITE"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-xl border border-blue-400/50 bg-blue-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-900/80 md:block"
          >
            Join Community
          </a>

          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white">
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
}