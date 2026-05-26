"use client";

import { useMemo, useState } from "react";
import {
  DiscordChannelSelect,
  useDiscordChannels,
} from "@/components/DiscordResourceSelects";
import {
  ErrorNotice,
  InfoNotice,
  SuccessNotice,
} from "@/components/ServerReadOnlySection";

export type EditableServerSettings = {
  weekly_digest_enabled: boolean;
  weekly_digest_day: number;
  weekly_digest_hour: number;
  welcome_enabled: boolean;
  notifications_enabled: boolean;
  default_timezone: string;
  event_reminders_enabled: boolean;
  welcome_channel_id: string;
  digest_channel_id: string;
  logs_channel_id: string;
  events_channel_id: string;
  activity_channel_id: string;
};

const defaultSettings: EditableServerSettings = {
  weekly_digest_enabled: false,
  weekly_digest_day: 1,
  weekly_digest_hour: 9,
  welcome_enabled: false,
  notifications_enabled: true,
  default_timezone: "UTC",
  event_reminders_enabled: true,
  welcome_channel_id: "",
  digest_channel_id: "",
  logs_channel_id: "",
  events_channel_id: "",
  activity_channel_id: "",
};

const digestDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function normalizeSettings(
  settings: Partial<EditableServerSettings> | null
): EditableServerSettings {
  return {
    weekly_digest_enabled:
      typeof settings?.weekly_digest_enabled === "boolean"
        ? settings.weekly_digest_enabled
        : defaultSettings.weekly_digest_enabled,
    weekly_digest_day:
      typeof settings?.weekly_digest_day === "number"
        ? settings.weekly_digest_day
        : defaultSettings.weekly_digest_day,
    weekly_digest_hour:
      typeof settings?.weekly_digest_hour === "number"
        ? settings.weekly_digest_hour
        : defaultSettings.weekly_digest_hour,
    welcome_enabled:
      typeof settings?.welcome_enabled === "boolean"
        ? settings.welcome_enabled
        : defaultSettings.welcome_enabled,
    notifications_enabled:
      typeof settings?.notifications_enabled === "boolean"
        ? settings.notifications_enabled
        : defaultSettings.notifications_enabled,
    default_timezone:
      typeof settings?.default_timezone === "string" &&
      settings.default_timezone.trim()
        ? settings.default_timezone
        : defaultSettings.default_timezone,
    event_reminders_enabled:
      typeof settings?.event_reminders_enabled === "boolean"
        ? settings.event_reminders_enabled
        : defaultSettings.event_reminders_enabled,
    welcome_channel_id:
      typeof settings?.welcome_channel_id === "string"
        ? settings.welcome_channel_id
        : defaultSettings.welcome_channel_id,
    digest_channel_id:
      typeof settings?.digest_channel_id === "string"
        ? settings.digest_channel_id
        : defaultSettings.digest_channel_id,
    logs_channel_id:
      typeof settings?.logs_channel_id === "string"
        ? settings.logs_channel_id
        : defaultSettings.logs_channel_id,
    events_channel_id:
      typeof settings?.events_channel_id === "string"
        ? settings.events_channel_id
        : defaultSettings.events_channel_id,
    activity_channel_id:
      typeof settings?.activity_channel_id === "string"
        ? settings.activity_channel_id
        : defaultSettings.activity_channel_id,
  };
}

function Toggle({
  checked,
  disabled,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <span>
        <span className="block font-semibold text-white">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-400">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span className="relative h-7 w-12 shrink-0 rounded-full border border-white/10 bg-slate-700 transition peer-checked:bg-blue-500 peer-disabled:opacity-50">
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </label>
  );
}

export default function SettingsForm({
  guildId,
  initialSettings,
  loadError,
}: {
  guildId: string;
  initialSettings: Partial<EditableServerSettings> | null;
  loadError: boolean;
}) {
  const safeInitialSettings = useMemo(
    () => normalizeSettings(initialSettings),
    [initialSettings]
  );
  const [settings, setSettings] =
    useState<EditableServerSettings>(safeInitialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [loadNotice] = useState<string | null>(
    loadError ? "Safe settings defaults are shown until saved settings are available." : null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const channelsState = useDiscordChannels(guildId);

  async function saveSettings() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...settings,
            default_timezone: settings.default_timezone.trim(),
            welcome_channel_id: settings.welcome_channel_id.trim(),
            digest_channel_id: settings.digest_channel_id.trim(),
            logs_channel_id: settings.logs_channel_id.trim(),
            events_channel_id: settings.events_channel_id.trim(),
            activity_channel_id: settings.activity_channel_id.trim(),
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const details =
          data && Array.isArray(data.details) ? ` ${data.details[0]}` : "";
        throw new Error(
          `${data?.error ?? "Failed to save server settings."}${details}`
        );
      }

      setSettings(normalizeSettings(data?.settings ?? settings));
      setSuccess("Settings saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save server settings."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {loadNotice ? <InfoNotice>{loadNotice}</InfoNotice> : null}
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Automation
          </p>

          <div className="mt-6 space-y-4">
            <Toggle
              label="Weekly Digest"
              description="Send the server a scheduled weekly activity summary."
              checked={settings.weekly_digest_enabled}
              disabled={isSaving}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  weekly_digest_enabled: checked,
                }))
              }
            />

            <Toggle
              label="Event Reminders"
              description="Allow Kaelix to send reminders for upcoming events."
              checked={settings.event_reminders_enabled}
              disabled={isSaving}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  event_reminders_enabled: checked,
                }))
              }
            />

            <Toggle
              label="Welcome Messages"
              description="Enable welcome behavior for new server members."
              checked={settings.welcome_enabled}
              disabled={isSaving}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  welcome_enabled: checked,
                }))
              }
            />

            <Toggle
              label="Notifications"
              description="Allow Kaelix to send dashboard-managed notifications."
              checked={settings.notifications_enabled}
              disabled={isSaving}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  notifications_enabled: checked,
                }))
              }
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Schedule
          </p>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-200">
                Digest day
              </span>
              <select
                value={settings.weekly_digest_day}
                disabled={isSaving}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    weekly_digest_day: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
              >
                {digestDays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">
                Digest hour
              </span>
              <input
                type="number"
                min={0}
                max={23}
                step={1}
                value={settings.weekly_digest_hour}
                disabled={isSaving}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    weekly_digest_hour: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">
                Default timezone
              </span>
              <input
                type="text"
                value={settings.default_timezone}
                disabled={isSaving}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    default_timezone: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
                placeholder="UTC"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
          Discord Channels
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Welcome channel"
            value={settings.welcome_channel_id}
            disabled={isSaving}
            onChange={(welcome_channel_id) =>
              setSettings((current) => ({ ...current, welcome_channel_id }))
            }
          />

          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Digest channel"
            value={settings.digest_channel_id}
            disabled={isSaving}
            onChange={(digest_channel_id) =>
              setSettings((current) => ({ ...current, digest_channel_id }))
            }
          />

          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Logs channel"
            value={settings.logs_channel_id}
            disabled={isSaving}
            onChange={(logs_channel_id) =>
              setSettings((current) => ({ ...current, logs_channel_id }))
            }
          />

          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Events channel"
            value={settings.events_channel_id}
            disabled={isSaving}
            onChange={(events_channel_id) =>
              setSettings((current) => ({ ...current, events_channel_id }))
            }
          />

          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Activity channel"
            value={settings.activity_channel_id}
            disabled={isSaving}
            onChange={(activity_channel_id) =>
              setSettings((current) => ({ ...current, activity_channel_id }))
            }
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={saveSettings}
          disabled={isSaving}
          className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {isSaving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
