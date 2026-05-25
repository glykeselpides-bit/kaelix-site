"use client";

import { useEffect, useMemo, useState } from "react";

export type EventItem = {
  id: number;
  name: string;
  eventCode: string;
  startsAt: string | null;
  sourceTimezone: string;
  status: string;
  channelId: string | null;
  rewardPoints: number;
  recurrence: string;
  createdAt: string | null;
};

type DiscordChannel = {
  id: string;
  name: string;
  type: string;
};

type EventDraft = {
  name: string;
  date: string;
  time: string;
  sourceTimezone: string;
  channelId: string;
  rewardPoints: string;
  status: string;
};

const timezoneOptions = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Athens",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
];

const statusOptions = ["scheduled", "active", "completed", "cancelled"];

const emptyDraft: EventDraft = {
  name: "",
  date: "",
  time: "",
  sourceTimezone: "UTC",
  channelId: "",
  rewardPoints: "0",
  status: "scheduled",
};

function getDatePartsInTimezone(value: string | null, timezone: string) {
  if (!value) {
    return { date: "", time: "" };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    );

    return {
      date: `${values.year}-${values.month}-${values.day}`,
      time: `${values.hour}:${values.minute}`,
    };
  } catch {
    const offsetMs = date.getTimezoneOffset() * 60_000;
    const localValue = new Date(date.getTime() - offsetMs)
      .toISOString()
      .slice(0, 16);

    return {
      date: localValue.slice(0, 10),
      time: localValue.slice(11, 16),
    };
  }
}

function toDraft(event: EventItem): EventDraft {
  const timezone = timezoneOptions.includes(event.sourceTimezone)
    ? event.sourceTimezone
    : "UTC";
  const dateParts = getDatePartsInTimezone(event.startsAt, timezone);

  return {
    name: event.name,
    date: dateParts.date,
    time: dateParts.time,
    sourceTimezone: timezone,
    channelId: event.channelId ?? "",
    rewardPoints: String(event.rewardPoints),
    status: event.status,
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

function getTimezoneParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function toUtcIso(dateValue: string, timeValue: string, timezone: string) {
  if (!dateValue || !timeValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
    return "";
  }

  try {
    const target = Date.UTC(year, month - 1, day, hour, minute, 0);
    let guess = target;

    for (let index = 0; index < 3; index += 1) {
      const parts = getTimezoneParts(new Date(guess), timezone);
      const rendered = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
      );
      guess -= rendered - target;
    }

    return new Date(guess).toISOString();
  } catch {
    return new Date(`${dateValue}T${timeValue}`).toISOString();
  }
}

function normalizeDraft(draft: EventDraft) {
  return {
    name: draft.name.trim(),
    startsAt: toUtcIso(draft.date, draft.time, draft.sourceTimezone),
    sourceTimezone: draft.sourceTimezone,
    channelId: draft.channelId.trim(),
    rewardPoints: Number(draft.rewardPoints),
    status: draft.status,
  };
}

function formatEventDate(value: string | null, timezone: string) {
  if (!value) {
    return "Not scheduled";
  }

  const safeTimezone = timezoneOptions.includes(timezone) ? timezone : "UTC";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: safeTimezone,
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getChannelLabel(channels: DiscordChannel[], channelId: string | null) {
  if (!channelId) {
    return "No channel";
  }

  const channel = channels.find((item) => item.id === channelId);
  return channel ? `#${channel.name}` : channelId;
}

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  disabled,
  placeholder,
  maxLength,
  type = "text",
  min,
  onChange,
}: {
  value: string;
  disabled: boolean;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  min?: number;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      min={min}
      step={type === "number" ? 1 : undefined}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
    />
  );
}

function SelectInput({
  value,
  disabled,
  children,
  onChange,
}: {
  value: string;
  disabled: boolean;
  children: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
    >
      {children}
    </select>
  );
}

function EventFields({
  draft,
  disabled,
  channels,
  channelsLoading,
  channelsError,
  showStatus,
  onChange,
}: {
  draft: EventDraft;
  disabled: boolean;
  channels: DiscordChannel[];
  channelsLoading: boolean;
  channelsError: string | null;
  showStatus: boolean;
  onChange: (draft: EventDraft) => void;
}) {
  const useManualChannel = channelsError !== null || channels.length === 0;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <FieldShell label="Event name">
        <TextInput
          value={draft.name}
          disabled={disabled}
          maxLength={100}
          placeholder="Weekly event"
          onChange={(name) => onChange({ ...draft, name })}
        />
      </FieldShell>

      <FieldShell label="Channel">
        {useManualChannel ? (
          <>
            <TextInput
              value={draft.channelId}
              disabled={disabled}
              placeholder="123456789012345678"
              onChange={(channelId) => onChange({ ...draft, channelId })}
            />
            <span className="mt-2 block text-xs text-amber-200">
              {channelsError ?? "No eligible Discord channels were returned."}
            </span>
          </>
        ) : (
          <>
            <SelectInput
              value={draft.channelId}
              disabled={disabled || channelsLoading}
              onChange={(channelId) => onChange({ ...draft, channelId })}
            >
              <option value="">
                {channelsLoading ? "Loading channels..." : "Choose a channel"}
              </option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </SelectInput>
            <span className="mt-2 block text-xs text-slate-500">
              Text, announcement, and forum channels are shown.
            </span>
          </>
        )}
      </FieldShell>

      <FieldShell label="Date">
        <TextInput
          type="date"
          value={draft.date}
          disabled={disabled}
          onChange={(date) => onChange({ ...draft, date })}
        />
      </FieldShell>

      <FieldShell label="Time">
        <TextInput
          type="time"
          value={draft.time}
          disabled={disabled}
          onChange={(time) => onChange({ ...draft, time })}
        />
      </FieldShell>

      <FieldShell label="Timezone">
        <SelectInput
          value={draft.sourceTimezone}
          disabled={disabled}
          onChange={(sourceTimezone) => onChange({ ...draft, sourceTimezone })}
        >
          {timezoneOptions.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </SelectInput>
      </FieldShell>

      <FieldShell label="Reward points">
        <TextInput
          type="number"
          min={0}
          value={draft.rewardPoints}
          disabled={disabled}
          onChange={(rewardPoints) => onChange({ ...draft, rewardPoints })}
        />
      </FieldShell>

      {showStatus ? (
        <FieldShell label="Status">
          <SelectInput
            value={draft.status}
            disabled={disabled}
            onChange={(status) => onChange({ ...draft, status })}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </SelectInput>
        </FieldShell>
      ) : null}
    </div>
  );
}

export default function EventsManager({
  guildId,
  initialEvents,
  loadError,
}: {
  guildId: string;
  initialEvents: EventItem[];
  loadError: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<Record<number, EventDraft>>(() =>
    Object.fromEntries(initialEvents.map((event) => [event.id, toDraft(event)]))
  );
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    loadError ? "Events could not be loaded." : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const openCount = useMemo(
    () =>
      events.filter(
        (event) => event.status === "scheduled" || event.status === "active"
      ).length,
    [events]
  );

  const isBusy = busyAction !== null;

  useEffect(() => {
    let isMounted = true;

    async function loadChannels() {
      setChannelsLoading(true);
      setChannelsError(null);

      try {
        const response = await fetch(
          `/api/servers/${encodeURIComponent(guildId)}/discord/channels`,
          { cache: "no-store" }
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Discord channels could not be loaded.")
          );
        }

        const nextChannels = Array.isArray(data?.channels) ? data.channels : [];

        if (isMounted) {
          setChannels(nextChannels);
          setCreateDraft((current) => ({
            ...current,
            channelId: current.channelId || nextChannels[0]?.id || "",
          }));
        }
      } catch (loadError) {
        if (isMounted) {
          setChannelsError(
            loadError instanceof Error
              ? loadError.message
              : "Discord channels could not be loaded."
          );
        }
      } finally {
        if (isMounted) {
          setChannelsLoading(false);
        }
      }
    }

    loadChannels();

    return () => {
      isMounted = false;
    };
  }, [guildId]);

  async function refreshEvents() {
    const response = await fetch(
      `/api/servers/${encodeURIComponent(guildId)}/events`,
      { cache: "no-store" }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to refresh events."));
    }

    const nextEvents = Array.isArray(data?.events) ? data.events : [];
    setEvents(nextEvents);
    setEditing(
      Object.fromEntries(
        nextEvents.map((event: EventItem) => [event.id, toDraft(event)])
      )
    );
  }

  async function createEvent() {
    setBusyAction("create");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizeDraft(createDraft)),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to create event."));
      }

      await refreshEvents();
      setCreateDraft({
        ...emptyDraft,
        channelId: channels[0]?.id ?? "",
      });
      setSuccess("Event created.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create event."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function saveEvent(eventId: number) {
    const draft = editing[eventId];

    if (!draft) {
      return;
    }

    setBusyAction(`save-${eventId}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/events`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: eventId,
            ...normalizeDraft(draft),
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to save event."));
      }

      await refreshEvents();
      setEditingEventId(null);
      setSuccess("Event saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save event."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function cancelEvent(eventId: number) {
    setBusyAction(`cancel-${eventId}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/events`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: eventId }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to cancel event."));
      }

      await refreshEvents();
      setEditingEventId(null);
      setSuccess("Event cancelled.");
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel event."
      );
    } finally {
      setBusyAction(null);
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

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
              Create
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">New event</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
            {channelsLoading ? "Loading channels..." : `${openCount} open / ${events.length} total`}
          </div>
        </div>

        <div className="mt-6">
          <EventFields
            draft={createDraft}
            disabled={isBusy}
            channels={channels}
            channelsLoading={channelsLoading}
            channelsError={channelsError}
            showStatus={false}
            onChange={setCreateDraft}
          />
        </div>

        <button
          type="button"
          onClick={createEvent}
          disabled={isBusy}
          className="mt-6 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {busyAction === "create" ? "Creating..." : "Create event"}
        </button>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Manage
          </p>
          {busyAction && busyAction !== "create" ? (
            <span className="text-sm text-slate-400">Saving...</span>
          ) : null}
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
            No events found for this server yet.
          </div>
        ) : (
          events.map((event) => {
            const draft = editing[event.id] ?? toDraft(event);
            const isCancelled = event.status === "cancelled";
            const isEditing = editingEventId === event.id;

            return (
              <article
                key={event.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-white">
                        {event.name}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          isCancelled
                            ? "border-red-400/20 bg-red-500/10 text-red-100"
                            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                        }`}
                      >
                        {formatStatus(event.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                      <span>
                        {formatEventDate(event.startsAt, event.sourceTimezone)}
                      </span>
                      <span>{getChannelLabel(channels, event.channelId)}</span>
                      <span>{event.rewardPoints} pts</span>
                      {event.recurrence !== "none" ? (
                        <span>Recurs {event.recurrence}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingEventId((current) =>
                          current === event.id ? null : event.id
                        )
                      }
                      disabled={isBusy}
                      className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isEditing ? "Close" : "Edit"}
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelEvent(event.id)}
                      disabled={isBusy || isCancelled}
                      className="rounded-2xl border border-red-400/20 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyAction === `cancel-${event.id}`
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <EventFields
                      draft={draft}
                      disabled={isBusy}
                      channels={channels}
                      channelsLoading={channelsLoading}
                      channelsError={channelsError}
                      showStatus
                      onChange={(nextDraft) =>
                        setEditing((current) => ({
                          ...current,
                          [event.id]: nextDraft,
                        }))
                      }
                    />

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => saveEvent(event.id)}
                        disabled={isBusy}
                        className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                      >
                        {busyAction === `save-${event.id}`
                          ? "Saving..."
                          : "Save changes"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditing((current) => ({
                            ...current,
                            [event.id]: toDraft(event),
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
