"use client";

import { useMemo, useState } from "react";

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

type EventDraft = {
  name: string;
  startsAt: string;
  sourceTimezone: string;
  channelId: string;
  rewardPoints: string;
  status: string;
};

const emptyDraft: EventDraft = {
  name: "",
  startsAt: "",
  sourceTimezone: "UTC",
  channelId: "",
  rewardPoints: "0",
  status: "scheduled",
};

const statusOptions = ["scheduled", "active", "completed", "cancelled"];

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toDraft(event: EventItem): EventDraft {
  return {
    name: event.name,
    startsAt: toDateTimeLocal(event.startsAt),
    sourceTimezone: event.sourceTimezone || "UTC",
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

function normalizeDraft(draft: EventDraft) {
  return {
    name: draft.name.trim(),
    startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : "",
    sourceTimezone: draft.sourceTimezone.trim() || "UTC",
    channelId: draft.channelId.trim(),
    rewardPoints: Number(draft.rewardPoints),
    status: draft.status,
  };
}

function formatEventDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function TextField({
  label,
  value,
  disabled,
  placeholder,
  maxLength,
  type = "text",
  min,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  min?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
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
    </label>
  );
}

function SelectField({
  label,
  value,
  disabled,
  options,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatStatus(option)}
          </option>
        ))}
      </select>
    </label>
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
  const [createDraft, setCreateDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<Record<number, EventDraft>>(() =>
    Object.fromEntries(initialEvents.map((event) => [event.id, toDraft(event)]))
  );
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
      setCreateDraft(emptyDraft);
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
            {openCount} open / {events.length} total
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <TextField
            label="Name"
            value={createDraft.name}
            disabled={isBusy}
            maxLength={100}
            placeholder="Weekly raid"
            onChange={(name) =>
              setCreateDraft((current) => ({ ...current, name }))
            }
          />

          <TextField
            label="Channel ID"
            value={createDraft.channelId}
            disabled={isBusy}
            placeholder="123456789012345678"
            onChange={(channelId) =>
              setCreateDraft((current) => ({ ...current, channelId }))
            }
          />

          <TextField
            label="Date and time"
            type="datetime-local"
            value={createDraft.startsAt}
            disabled={isBusy}
            onChange={(startsAt) =>
              setCreateDraft((current) => ({ ...current, startsAt }))
            }
          />

          <TextField
            label="Reward points"
            type="number"
            min={0}
            value={createDraft.rewardPoints}
            disabled={isBusy}
            onChange={(rewardPoints) =>
              setCreateDraft((current) => ({ ...current, rewardPoints }))
            }
          />

          <TextField
            label="Timezone"
            value={createDraft.sourceTimezone}
            disabled={isBusy}
            maxLength={64}
            placeholder="UTC"
            onChange={(sourceTimezone) =>
              setCreateDraft((current) => ({ ...current, sourceTimezone }))
            }
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

            return (
              <article
                key={event.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-white">
                        {event.name}
                      </h3>
                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-300">
                        {event.eventCode}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {formatEventDate(event.startsAt)} / Channel{" "}
                      {event.channelId ?? "not set"} / {event.rewardPoints} pts
                    </p>
                    {event.recurrence !== "none" ? (
                      <p className="mt-1 text-sm text-slate-500">
                        Recurs {event.recurrence}
                      </p>
                    ) : null}
                  </div>

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

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <TextField
                    label="Name"
                    value={draft.name}
                    disabled={isBusy}
                    maxLength={100}
                    onChange={(name) =>
                      setEditing((current) => ({
                        ...current,
                        [event.id]: { ...draft, name },
                      }))
                    }
                  />

                  <TextField
                    label="Channel ID"
                    value={draft.channelId}
                    disabled={isBusy}
                    onChange={(channelId) =>
                      setEditing((current) => ({
                        ...current,
                        [event.id]: { ...draft, channelId },
                      }))
                    }
                  />

                  <TextField
                    label="Date and time"
                    type="datetime-local"
                    value={draft.startsAt}
                    disabled={isBusy}
                    onChange={(startsAt) =>
                      setEditing((current) => ({
                        ...current,
                        [event.id]: { ...draft, startsAt },
                      }))
                    }
                  />

                  <TextField
                    label="Reward points"
                    type="number"
                    min={0}
                    value={draft.rewardPoints}
                    disabled={isBusy}
                    onChange={(rewardPoints) =>
                      setEditing((current) => ({
                        ...current,
                        [event.id]: { ...draft, rewardPoints },
                      }))
                    }
                  />

                  <TextField
                    label="Timezone"
                    value={draft.sourceTimezone}
                    disabled={isBusy}
                    maxLength={64}
                    onChange={(sourceTimezone) =>
                      setEditing((current) => ({
                        ...current,
                        [event.id]: { ...draft, sourceTimezone },
                      }))
                    }
                  />

                  <SelectField
                    label="Status"
                    value={draft.status}
                    disabled={isBusy}
                    options={statusOptions}
                    onChange={(status) =>
                      setEditing((current) => ({
                        ...current,
                        [event.id]: { ...draft, status },
                      }))
                    }
                  />
                </div>

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

                  <button
                    type="button"
                    onClick={() => cancelEvent(event.id)}
                    disabled={isBusy || isCancelled}
                    className="rounded-2xl border border-red-400/20 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === `cancel-${event.id}`
                      ? "Cancelling..."
                      : "Cancel event"}
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
