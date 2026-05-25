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

function formatCooldown(seconds: string) {
  const parsed = Number(seconds);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "No cooldown";
  }

  if (parsed >= 60 && parsed % 60 === 0) {
    return `${parsed / 60} min`;
  }

  return `${parsed}s`;
}

function NumberInput({
  label,
  value,
  disabled,
  helperText,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  helperText?: string;
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
      {helperText ? (
        <span className="mt-2 block text-xs text-slate-500">{helperText}</span>
      ) : null}
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
  const [selectedKey, setSelectedKey] = useState(
    initialActivities[0]?.activityKey ?? ""
  );
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

  const selectedActivity =
    activities.find((activity) => activity.activityKey === selectedKey) ??
    activities[0] ??
    null;
  const selectedDraft = selectedActivity
    ? drafts[selectedActivity.activityKey] ?? toDraft(selectedActivity)
    : null;
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

    if (
      nextActivities.length > 0 &&
      !nextActivities.some((activity) => activity.activityKey === selectedKey)
    ) {
      setSelectedKey(nextActivities[0].activityKey);
    }
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

  function updateSelectedDraft(patch: Partial<ActivityDraft>) {
    if (!selectedActivity || !selectedDraft) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [selectedActivity.activityKey]: { ...selectedDraft, ...patch },
    }));
  }

  return (
    <section className="space-y-5">
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Activity Settings
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Choose one activity to configure
          </h2>
        </div>
        <div className="text-sm text-slate-400">
          {enabledCount} enabled / {configuredCount} configured
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
          No activity systems configured yet.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activities.map((activity) => {
              const draft = drafts[activity.activityKey] ?? toDraft(activity);
              const isSelected = activity.activityKey === selectedActivity?.activityKey;

              return (
                <button
                  key={activity.activityKey}
                  type="button"
                  onClick={() => setSelectedKey(activity.activityKey)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-blue-300/60 bg-blue-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{activity.label}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                        draft.enabled
                          ? "bg-emerald-400/10 text-emerald-100"
                          : "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {draft.enabled ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <p>{draft.rewardPoints || 0} reward points</p>
                    <p>{formatCooldown(draft.cooldownSeconds)}</p>
                    <p>{getChannelLabel(channels, draft.channelId)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedActivity && selectedDraft ? (
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedActivity.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {selectedActivity.configured
                      ? "Dashboard-managed"
                      : "Using defaults until saved"}
                  </p>
                </div>
                <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={selectedDraft.enabled}
                    disabled={isBusy}
                    onChange={(event) =>
                      updateSelectedDraft({ enabled: event.target.checked })
                    }
                    className="h-5 w-5 accent-blue-500"
                  />
                  Enabled
                </label>
              </div>

              <div className="mt-6 grid gap-5">
                <NumberInput
                  label="Reward points"
                  value={selectedDraft.rewardPoints}
                  disabled={isBusy}
                  onChange={(rewardPoints) =>
                    updateSelectedDraft({ rewardPoints })
                  }
                />

                <NumberInput
                  label="Cooldown seconds"
                  value={selectedDraft.cooldownSeconds}
                  disabled={isBusy}
                  helperText={
                    selectedDraft.cooldownSeconds
                      ? `Current cooldown: ${formatCooldown(
                          selectedDraft.cooldownSeconds
                        )}`
                      : "Use 0 for no cooldown."
                  }
                  onChange={(cooldownSeconds) =>
                    updateSelectedDraft({ cooldownSeconds })
                  }
                />

                <DiscordChannelSelect
                  guildId={guildId}
                  channelsState={channelsState}
                  value={selectedDraft.channelId}
                  disabled={isBusy}
                  label="Activity channel"
                  placeholder="Any channel"
                  helperText=""
                  onChange={(channelId) => updateSelectedDraft({ channelId })}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => saveActivity(selectedActivity)}
                  disabled={isBusy}
                  className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                >
                  {savingKey === selectedActivity.activityKey
                    ? "Saving..."
                    : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDrafts((current) => ({
                      ...current,
                      [selectedActivity.activityKey]: toDraft(selectedActivity),
                    }))
                  }
                  disabled={isBusy}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset
                </button>
              </div>
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}
