"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const items = [
  { label: "Commands", href: "/commands" },
  { label: "Pricing", href: "/pricing" },
  { label: "Add-ons", href: "/add-ons" },
  { label: "Powered by Kaelix", href: "/powered-by-kaelix" },
  { label: "Docs", href: "/docs" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Status", href: "/status" },
];

const communityUrl = "https://discord.gg/2PYbjwmHRX";

const itemClass =
  "rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white";

export default function Dropdown() {
  // "loading" while the session is being checked: show neither Log in nor
  // Log out, so a logged-in user never sees "Log in" flash up.
  const { status } = useSession();

  return (
    <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col p-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={itemClass}>
            {item.label}
          </Link>
        ))}

        {status === "authenticated" && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={itemClass}
          >
            Log out
          </button>
        )}

        {status === "unauthenticated" && (
          <Link href="/login" className={itemClass}>
            Log in
          </Link>
        )}

        <a
          href={communityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
        >
          Community
        </a>
      </div>
    </div>
  );
}
