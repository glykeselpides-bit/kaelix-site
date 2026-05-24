"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function DashboardGate() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="mt-8 text-slate-400">Checking login...</p>;
  }

  if (!session) {
    return (
      <div className="mt-10">
        <Link
          href="/login"
          className="inline-flex rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-500"
        >
          Log in with Discord
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
        Logged in as
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        {session.user?.name}
      </h2>

      <p className="mt-4 text-slate-400">
        Server management tools are coming next.
      </p>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-8 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:border-blue-400 hover:bg-blue-500/10"
      >
        Log out
      </button>
    </div>
  );
}