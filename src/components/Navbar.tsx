"use client";

import { useState } from "react";

type NavbarProps = {
  variant?: "home" | "page";
};

const communityUrl = "https://discord.gg/2PYbjwmHRX";
const inviteUrl =
  "https://discord.com/oauth2/authorize?client_id=1506753052173139968&permissions=8&integration_type=0&scope=bot+applications.commands";

export default function Navbar({ variant = "page" }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const isHome = variant === "home";

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a
          href={isHome ? "#top" : "/"}
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

        {isHome && (
          <div className="hidden items-center gap-8 text-sm text-slate-300 lg:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#preview" className="transition hover:text-white">
              Preview
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a
              href={communityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              Community
            </a>
          </div>
        )}

        <div className="relative flex items-center gap-4">
          <a
            href={isHome ? inviteUrl : communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-xl border border-blue-400/50 bg-blue-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-900/80 md:block"
          >
            {isHome ? "Add to Discord" : "Join Community"}
          </a>

          <button
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
            aria-label="Open menu"
          >
            ☰
          </button>

          {open && (
            <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl">
              <a href="/commands" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Commands
              </a>
              <a href="/pricing" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Pricing
              </a>
              <a href="/docs" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Docs
              </a>
              <a href="/dashboard" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Dashboard
              </a>
              <a href="/status" className="block px-5 py-4 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Status
              </a>
              <a
                href={communityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-5 py-4 text-sm text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
              >
                Community
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}