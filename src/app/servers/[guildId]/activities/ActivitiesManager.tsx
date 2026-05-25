"use client";

import { useMemo, useState } from "react";
import {
  DiscordChannelSelect,
  type DiscordChannel,
  useDiscordChannels,
} from "@/components/DiscordResourceSelects";

export type ActivitySetting = {
  activityKey: string;
  label: string;
  enabled: boolean;
  rewardPoints: number;
  cooldownSeconds: number;
  channelId: string | null;
  configured: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type ActivityDraft = {
  enabled: boolean;
  rewardPoints: string;
  cooldownSeconds: string;
  channelId: string;
};

type ActivitiesPayload = {
  activities: ActivitySetting[];
  metrics: {
    enabledActivityTypes: number;
    configuredActivityTypes: number;
  };
};

function toDraft(activity: ActivitySetting): ActivityDraft {
  return {
    enabled: activity.enabled,
    rewardPoints: String(activity.rewardPoints),
    cooldownSeconds: String(activity.cooldownSeconds),
    channelId: activity.channelId ?? "",
  };
}

function getErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    const details =
      "details" in data && Array.isArray(data.details)
        ? ` ${data.details[0]}`
        : "";

    return `${data.error}${details}`;
  }

  return fallback;
}

function parseNonNegativeInteger(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return {
      ok: false as const,
      error: `${label} must be a non-negative whole number.`,
    };
  }

  return { ok: true as const, value: parsed };
}

function getChannelLabel(channels: DiscordChannel[], channelId: string) {
  if (!channelId) {
    return "Any channel";
  }

  const channel = channels.find((item) => item.id === channelId);
  return channel ? `#${channel.name}` : channelId;
}

function NumberInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
      />
    </label>
  );
}

export default function ActivitiesManager({
  guildId,
  initialActivities,
  loadError,
}: {
  guildId: string;
  initialActivities: ActivitySetting[];
  loadError: boolean;
}) {
  const channelsState = useDiscordChannels(guildId);
  const { items: channels } = channelsState;
  const [activities, setActivities] = useState(initialActivities);
  const [drafts, setDrafts] = useState<Record<string, ActivityDraft>>(() =>
    Object.fromEntries(
      initialActivities.map((activity) => [
        activity.activityKey,
        toDraft(activity),
      ])
    )
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    loadError ? "Activities could not be loaded." : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const enabledCount = useMemo(
    () => activities.filter((activity) => activity.enabled).length,
    [activities]
  );
  const configuredCount = useMemo(
    () => activities.filter((activity) => activity.configured).length,
    [activities]
  );
  const isBusy = savingKey !== null;

  async function refreshFromPayload(payload: ActivitiesPayload) {
    const nextActivities = Array.isArray(payload.activities)
      ? payload.activities
      : [];

    setActivities(nextActivities);
    setDrafts(
      Object.fromEntries(
        nextActivities.map((activity) => [
          activity.activityKey,
          toDraft(activity),
        ])
      )
    );
  }

  async function saveActivity(activity: ActivitySetting) {
    const draft = drafts[activity.activityKey] ?? toDraft(activity);
    const rewardPoints = parseNonNegativeInteger(
      draft.rewardPoints,
      "Reward points"
    );

    if (!rewardPoints.ok) {
      setError(rewardPoints.error);
      setSuccess(null);
      return;
    }

    const cooldownSeconds = parseNonNegativeInteger(
      draft.cooldownSeconds,
      "Cooldown"
    );

    if (!cooldownSeconds.ok) {
      setError(cooldownSeconds.error);
      setSuccess(null);
      return;
    }

    setSavingKey(activity.activityKey);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/activities`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityKey: activity.activityKey,
            enabled: draft.enabled,
            rewardPoints: rewardPoints.value,
            cooldownSeconds: cooldownSeconds.value,
            channelId: draft.channelId.trim() || null,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to save activity settings.")
        );
      }

      await refreshFromPayload(data);
      setSuccess(`${activity.label} saved.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save activity settings."
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            error
              ? "border-red-500/20 bg-red-500/10 text-red-100"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
          }`}
        >
          {error ?? success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Enabled Types", enabledCount],
          ["Configured Types", configuredCount],
          ["Available Types", activities.length],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        {activities.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
            No manageable activities are available yet.
          </div>
        ) : (
          activities.map((activity) => {
            const draft = drafts[activity.activityKey] ?? toDraft(activity);

            return (
              <article
                key={activity.activityKey}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-white">
                        {activity.label}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          draft.enabled
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                            : "border-slate-400/20 bg-slate-500/10 text-slate-300"
                        }`}
                      >
                        {draft.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {!activity.configured ? (
                        <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-100">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                      <span>{draft.rewardPoints || 0} pts</span>
                      <span>{draft.cooldownSeconds || 0}s cooldown</span>
                      <span>{getChannelLabel(channels, draft.channelId)}</span>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      disabled={isBusy}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [activity.activityKey]: {
                            ...draft,
                            enabled: event.target.checked,
                          },
                        }))
                      }
                      className="h-5 w-5 accent-blue-500"
                    />
                    Enabled
                  </label>
                </div>

                <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 lg:grid-cols-3">
                  <NumberInput
                    label="Reward points"
                    value={draft.rewardPoints}
                    disabled={isBusy}
                    onChange={(rewardPoints) =>
                      setDrafts((current) => ({
                        ...current,
                        [activity.activityKey]: { ...draft, rewardPoints },
                      }))
                    }
                  />

                  <NumberInput
                    label="Cooldown seconds"
                    value={draft.cooldownSeconds}
                    disabled={isBusy}
                    onChange={(cooldownSeconds) =>
                      setDrafts((current) => ({
                        ...current,
                        [activity.activityKey]: { ...draft, cooldownSeconds },
                      }))
                    }
                  />

                  <DiscordChannelSelect
                    guildId={guildId}
                    channelsState={channelsState}
                    value={draft.channelId}
                    disabled={isBusy}
                    label="Activity channel"
                    placeholder="Any channel"
                    helperText=""
                    onChange={(channelId) =>
                      setDrafts((current) => ({
                        ...current,
                        [activity.activityKey]: { ...draft, channelId },
                      }))
                    }
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveActivity(activity)}
                    disabled={isBusy}
                    className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                  >
                    {savingKey === activity.activityKey
                      ? "Saving..."
                      : "Save changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDrafts((current) => ({
                        ...current,
                        [activity.activityKey]: toDraft(activity),
                      }))
                    }
                    disabled={isBusy}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
