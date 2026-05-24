"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

function canManageServer(permissions: string, owner: boolean) {
  if (owner) return true;

  const permissionBits = BigInt(permissions);

  const ADMINISTRATOR = BigInt(0x0000000000000008);
  const MANAGE_GUILD = BigInt(0x0000000000000020);

  return (
    (permissionBits & ADMINISTRATOR) === ADMINISTRATOR ||
    (permissionBits & MANAGE_GUILD) === MANAGE_GUILD
  );
}

export default function DashboardGate() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);

  useEffect(() => {
    if (!session) return;

    async function loadGuilds() {
      setLoadingGuilds(true);

      const response = await fetch("/api/discord/guilds");
      const data = await response.json();

      if (Array.isArray(data)) {
        setGuilds(data);
      }

      setLoadingGuilds(false);
    }

    loadGuilds();
  }, [session]);

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

  const manageableGuilds = guilds.filter((guild) =>
    canManageServer(guild.permissions, guild.owner)
  );

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
          Select a Discord server you manage.
        </p>
      </div>

      {loadingGuilds && (
        <p className="mt-8 text-slate-400">Loading your servers...</p>
      )}

      {!loadingGuilds && manageableGuilds.length === 0 && (
        <p className="mt-8 text-slate-400">
          No manageable Discord servers found for this account.
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {manageableGuilds.map((guild) => (
          <div
            key={guild.id}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-blue-400/40 hover:bg-blue-500/[0.03]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {guild.name}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Server ID: {guild.id}
                </p>
              </div>

              <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                Manageable
              </div>
            </div>

            <button className="mt-8 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/10">
              Manage Server
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