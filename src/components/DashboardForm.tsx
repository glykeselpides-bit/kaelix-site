"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { DiscordChannel, DiscordRole } from "@/components/DiscordResourceSelects";

/** Building blocks for the dashboard's settings forms (same look as the Settings page). */

export const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60";

export function Panel({ title, description, children, locked }: {
  title: string;
  description?: string;
  children: ReactNode;
  locked?: string | null;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">{title}</p>
        {locked ? (
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
            {"\u{1F512}"} {locked}
          </span>
        ) : null}
      </div>
      {description ? <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p> : null}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function Toggle({ checked, disabled, label, description, onChange }: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span>
        <span className="block font-semibold text-white">{label}</span>
        {description ? <span className="mt-1 block text-sm leading-6 text-slate-400">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-7 w-12 shrink-0 rounded-full border border-white/10 bg-slate-700 transition peer-checked:bg-blue-500">
        <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </label>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function NumberInput({ value, min, max, step = 1, disabled, onChange }: {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))}
      className={inputClass}
    />
  );
}

export function SaveButton({ saving, onClick, label = "Save changes", disabled = false }: {
  saving: boolean;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
    >
      {saving ? "Saving..." : label}
    </button>
  );
}

export function SmallButton({ children, onClick, disabled, tone = "neutral" }: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger" | "primary";
}) {
  const tones = {
    neutral: "border-white/15 bg-white/5 text-slate-200 hover:border-blue-400",
    danger: "border-red-400/30 bg-red-500/10 text-red-100 hover:border-red-300",
    primary: "border-blue-400/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/30",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

type Status = { saving: boolean; error: string | null; success: string | null };

/**
 * Sends a request to this server's dashboard API and tracks saving / error /
 * success. Returns the parsed JSON on success, or null.
 */
export function useDashboardRequest(guildId: string) {
  const [status, setStatus] = useState<Status>({ saving: false, error: null, success: null });

  const send = useCallback(
    async <T,>(section: string, method: string, body?: unknown, successText?: string): Promise<T | null> => {
      setStatus({ saving: true, error: null, success: null });
      try {
        const response = await fetch(`/api/servers/${encodeURIComponent(guildId)}/${section}`, {
          method,
          headers: body === undefined ? undefined : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const details = data && Array.isArray(data.details) ? ` ${data.details.join(" ")}` : "";
          throw new Error(`${data?.error ?? "Something went wrong."}${details}`);
        }
        setStatus({ saving: false, error: null, success: successText ?? "Saved." });
        return data as T;
      } catch (error) {
        setStatus({ saving: false, error: error instanceof Error ? error.message : "Something went wrong.", success: null });
        return null;
      }
    },
    [guildId]
  );

  return { ...status, send };
}

/** Pick several roles or channels: a dropdown to add one, and removable chips. */
export function IdPicker({ label, hint, kind, items, isLoading, value, disabled, onChange }: {
  label: string;
  hint?: string;
  kind: "role" | "channel";
  items: (DiscordRole | DiscordChannel)[];
  isLoading: boolean;
  value: string[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
}) {
  const names = new Map(items.map((item) => [item.id, item.name]));
  const prefix = kind === "channel" ? "#" : "@";
  const available = items.filter((item) => !value.includes(item.id));

  return (
    <div>
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {value.length === 0 ? <span className="text-sm text-slate-500">None</span> : null}
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
            {prefix}{names.get(id) ?? id}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(value.filter((item) => item !== id))}
              className="text-slate-400 hover:text-red-300"
              aria-label={`Remove ${names.get(id) ?? id}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <select
        value=""
        disabled={disabled || isLoading || available.length === 0}
        onChange={(event) => event.target.value && onChange([...value, event.target.value])}
        className={inputClass}
      >
        <option value="">{isLoading ? "Loading..." : `Add a ${kind}`}</option>
        {available.map((item) => (
          <option key={item.id} value={item.id}>
            {prefix}{item.name}
          </option>
        ))}
      </select>
      {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
    </div>
  );
}
