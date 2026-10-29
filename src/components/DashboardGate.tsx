"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import GuildAccessNotice, {
  type AccessProblem,
} from "@/components/GuildAccessNotice";
import { BOT_INVITE_URL } from "@/lib/discordStore";

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

const KNOWN_PROBLEMS: AccessProblem[] = [
  "not_logged_in",
  "login_expired",
  "discord_unavailable",
  "bot_list_unavailable",
];

/** The "reason" an API error carries, or the given fallback. */
async function problemFrom(
  response: Response,
  fallback: AccessProblem
): Promise<AccessProblem> {
  try {
    const body = await response.json();
    return KNOWN_PROBLEMS.includes(body?.reason) ? body.reason : fallback;
  } catch {
    return fallback;
  }
}

function inviteUrlFor(guildId: string) {
  return `${BOT_INVITE_URL}&guild_id=${guildId}&disable_guild_select=true`;
}

type GuildData = {
  guilds: DiscordGuild[];
  botGuildIds: string[];
  problem: AccessProblem | null;
};

async function loadGuildData(): Promise<GuildData> {
  const empty = { guilds: [], botGuildIds: [] };

  try {
    const userResponse = await fetch("/api/discord/guilds");

    if (!userResponse.ok) {
      return { ...empty, problem: await problemFrom(userResponse, "discord_unavailable") };
    }

    const userData = await userResponse.json();
    const guilds = Array.isArray(userData) ? userData : [];

    const botResponse = await fetch("/api/discord/bot-guilds");

    if (!botResponse.ok) {
      return { guilds, botGuildIds: [], problem: await problemFrom(botResponse, "bot_list_unavailable") };
    }

    const botData = await botResponse.json();
    return { guilds, botGuildIds: Array.isArray(botData) ? botData : [], problem: null };
  } catch {
    return { ...empty, problem: "discord_unavailable" };
  }
}

export default function DashboardGate() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [botGuildIds, setBotGuildIds] = useState<string[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(true);
  const [problem, setProblem] = useState<AccessProblem | null>(null);

  const apply = useCallback((data: GuildData) => {
    setGuilds(data.guilds);
    setBotGuildIds(data.botGuildIds);
    setProblem(data.problem);
    setLoadingGuilds(false);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    loadGuildData().then((data) => {
      if (!cancelled) {
        apply(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [status, apply]);

  const loadGuilds = useCallback(async () => {
    setLoadingGuilds(true);
    setProblem(null);
    apply(await loadGuildData());
  }, [apply]);

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

      {!loadingGuilds && problem && (
        <div className="mt-8">
          <GuildAccessNotice
            reason={problem}
            onRetry={loadGuilds}
            showServersLink={false}
          />
        </div>
      )}

      {!loadingGuilds && !problem && manageableGuilds.length === 0 && (
        <div className="mt-8 text-slate-400">
          <p>
            None of your Discord servers let you manage them. You need to own
            the server, or have Manage Server or Administrator in it.
          </p>

          <button
            type="button"
            onClick={loadGuilds}
            className="mt-4 text-sm font-semibold text-blue-300 underline-offset-4 hover:underline"
          >
            Check again
          </button>
        </div>
      )}

      <div className={`mt-8 grid gap-5 md:grid-cols-2 ${problem ? "hidden" : ""}`}>
        {manageableGuilds.map((guild) => {
          const isConnected = botGuildIds.includes(guild.id);

          return (
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
                  {isConnected ? "Connected" : "Invite Kaelix"}
                </div>
              </div>

              {isConnected ? (
                <Link
                  href={`/servers/${guild.id}`}
                  className="mt-8 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/10"
                >
                  Manage Server
                </Link>
              ) : (
                <a
                  href={inviteUrlFor(guild.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/10"
                >
                  Invite Kaelix
                </a>
              )}
            </div>
          );
        })}
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