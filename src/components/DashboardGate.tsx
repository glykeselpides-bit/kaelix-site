"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const mockServers = [
  {
    name: "The Source Wall",
    members: "382 Members",
    status: "Connected",
  },
  {
    name: "Kaelix Dev",
    members: "12 Members",
    status: "Connected",
  },
  {
    name: "Future Community",
    members: "Not Connected",
    status: "Invite Kaelix",
  },
];

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
    <div className="mt-12 w-full max-w-5xl rounded-[32px] border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-8 text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-300">
          Logged in as
        </p>

        <h2 className="text-4xl font-bold text-white">
          {session.user?.name}
        </h2>

        <p className="max-w-2xl text-slate-400">
          Select a server to manage with Kaelix.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {mockServers.map((server) => (
          <div
            key={server.name}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-blue-400/40 hover:bg-blue-500/[0.03]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {server.name}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  {server.members}
                </p>
              </div>

              <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                {server.status}
              </div>
            </div>

            <button className="mt-8 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/10">
              Open Dashboard
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-10 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-red-400 hover:bg-red-500/10"
      >
        Log out
      </button>
    </div>
  );
}