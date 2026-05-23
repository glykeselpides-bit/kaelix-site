"use client";

import Link from "next/link";

const items = [
  { label: "Commands", href: "/commands" },
  { label: "Pricing", href: "/pricing" },
  { label: "Add-ons", href: "/add-ons" },
  { label: "Powered by Kaelix", href: "/powered-by-kaelix" },
  { label: "Docs", href: "/docs" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Status", href: "/status" },
  { label: "Community", href: "/community" },
];

export default function Dropdown() {
  return (
    <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col p-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}