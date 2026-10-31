"use client";

import Link from "next/link";
import LoginButton from "@/components/LoginButton";

export type AccessProblem =
  | "not_logged_in"
  | "login_expired"
  | "discord_unavailable"
  | "forbidden"
  | "bot_list_unavailable";

const COPY: Record<AccessProblem, { title: string; body: string }> = {
  not_logged_in: {
    title: "Log in to continue",
    body: "Log in with Discord to manage your servers.",
  },
  login_expired: {
    title: "Your Discord login has expired",
    body: "Discord logins last about a week. Log in again to carry on.",
  },
  discord_unavailable: {
    title: "Couldn't reach Discord",
    body: "Discord didn't answer when we checked your servers. This is usually brief, so try again in a moment.",
  },
  bot_list_unavailable: {
    title: "Couldn't check where Kaelix is installed",
    body: "Discord didn't answer when we checked which servers have Kaelix. Try again in a moment.",
  },
  forbidden: {
    title: "You can't manage this server",
    body: "Only the server owner and members with Manage Server or Administrator can open its Kaelix dashboard.",
  },
};

const primary =
  "inline-flex rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500";
const secondary =
  "inline-flex rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/10";

/** Explains why a server or the server list couldn't be shown, with the one button that fixes it. */
export default function GuildAccessNotice({
  reason,
  onRetry,
  showServersLink = true,
}: {
  reason: AccessProblem;
  /** Off on the dashboard itself, where it would link to the same page. */
  showServersLink?: boolean;
  /** For "try again" problems. Defaults to reloading the page. */
  onRetry?: () => void;
}) {
  const { title, body } = COPY[reason];
  const retry = onRetry ?? (() => window.location.reload());

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-left backdrop-blur-xl">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-400">{body}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {(reason === "not_logged_in" || reason === "login_expired") && (
          <LoginButton
            callbackUrl="current"
            label={reason === "login_expired" ? "Log in again" : "Log in with Discord"}
            className={`${primary} disabled:cursor-wait disabled:opacity-70`}
          />
        )}

        {(reason === "discord_unavailable" ||
          reason === "bot_list_unavailable") && (
          <button type="button" onClick={retry} className={primary}>
            Try again
          </button>
        )}

        {reason === "forbidden" && (
          <Link href="/dashboard" className={primary}>
            Back to your servers
          </Link>
        )}

        {showServersLink && reason !== "forbidden" && reason !== "not_logged_in" && (
          <Link href="/dashboard" className={secondary}>
            Your servers
          </Link>
        )}
      </div>
    </div>
  );
}
