"use client";

import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="/" className="flex items-center gap-3 transition hover:opacity-80">
          <img src="/kx_Logo.png" alt="Kaelix Logo" className="h-10 w-10 object-contain" />
          <span className="text-base font-semibold uppercase tracking-[0.35em] text-slate-200">
            Kaelix
          </span>
        </a>

        <div className="relative flex items-center gap-4">
          <a
            href="https://discord.gg/278FuNrmfe"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-xl border border-blue-400/50 bg-blue-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-900/80 md:block"
          >
            Join Community
          </a>

          <button
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
          >
            ☰
          </button>

          {open && (
            <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl">
              <a href="/#features" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Features
              </a>
              <a href="/#preview" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Preview
              </a>
              <a href="/#pricing" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Pricing
              </a>
              <a href="/commands" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Commands
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}