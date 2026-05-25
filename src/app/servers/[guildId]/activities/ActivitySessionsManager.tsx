"use client";

import { useState } from "react";
import { formatDashboardDate } from "@/components/ServerReadOnlySection";

export type ActivitySession = {
  id: number;
  activityKey: string;
  type: string;
  status: string;
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  canEnd: boolean;
  endDisabledReason: string | null;
};

export type SessionsPayload = {
  activeSessions: ActivitySession[];
  recentSessions: ActivitySession[];
  sessions: ActivitySession[];
  warnings?: string[];
};

function getErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

function normalizeSessionsPayload(data: unknown): SessionsPayload {
  if (!data || typeof data !== "object") {
    return { activeSessions: [], recentSessions: [], sessions: [] };
  }

  const payload = data as Partial<SessionsPayload>;

  return {
    activeSessions: Array.isArray(payload.activeSessions)
      ? payload.activeSessions
      : Array.isArray(payload.sessions)
        ? payload.sessions
        : [],
    recentSessions: Array.isArray(payload.recentSessions)
      ? payload.recentSessions
      : [],
    sessions: Array.isArray(payload.sessions) ? payload.sessions : [],
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
  };
}

export default function ActivitySessionsManager({
  guildId,
  initialPayload,
}: {
  guildId: string;
  initialPayload: SessionsPayload;
}) {
  const [payload, setPayload] = useState<SessionsPayload>(initialPayload);
  const [isLoading, setIsLoading] = useState(false);
  const [endingKey, setEndingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadSessions() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/activities/sessions`,
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to load activity sessions.")
        );
      }

      setPayload(normalizeSessionsPayload(data));
    } catch (loadError) {
      setPayload({ activeSessions: [], recentSessions: [], sessions: [] });
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load activity sessions."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function endSession(session: ActivitySession) {
    const key = `${session.activityKey}-${session.id}`;
    setEndingKey(key);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/activities/sessions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "end",
            activityKey: session.activityKey,
            sessionId: session.id,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to end activity session.")
        );
      }

      setPayload(normalizeSessionsPayload(data));
      setSuccess(`${session.type} session ended.`);
    } catch (endError) {
      setError(
        endError instanceof Error
          ? endError.message
          : "Failed to end activity session."
      );
    } finally {
      setEndingKey(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Active Sessions
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Currently running activity games
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            These rows are live activity sessions with an active flag in their
            session table. Ending one marks it inactive and records an end time
            where the table supports it.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSessions}
          disabled={isLoading || endingKey !== null}
          className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {(error || success || payload.warnings?.length) && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            error
              ? "border-red-500/20 bg-red-500/10 text-red-100"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
          }`}
        >
          {error ?? success ?? payload.warnings?.[0]}
        </div>
      )}

      {payload.activeSessions.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
          {isLoading
            ? "Loading active sessions..."
            : "No activity games are currently running."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.25em] text-blue-300">
                <tr>
                  <th className="px-5 py-4 font-semibold">Activity</th>
                  <th className="px-5 py-4 font-semibold">Started</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {payload.activeSessions.map((session) => {
                  const actionKey = `${session.activityKey}-${session.id}`;

                  return (
                    <tr key={actionKey}>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-white">
                          {session.type}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Session #{session.id}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        {formatDashboardDate(session.startedAt)}
                      </td>
                      <td className="px-5 py-4 align-top">{session.status}</td>
                      <td className="px-5 py-4 align-top">
                        {session.canEnd ? (
                          <button
                            type="button"
                            onClick={() => endSession(session)}
                            disabled={endingKey !== null}
                            className="rounded-2xl border border-red-400/20 px-4 py-2 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {endingKey === actionKey
                              ? "Ending..."
                              : "End session"}
                          </button>
                        ) : (
                          <span className="text-sm text-amber-200">
                            {session.endDisabledReason ??
                              "Manual cleanup required"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
