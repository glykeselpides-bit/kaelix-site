"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDiscordChannels } from "@/components/DiscordResourceSelects";
import { ErrorNotice } from "@/components/ServerReadOnlySection";
import { inputClass } from "@/components/DashboardForm";

type Day = { date: string; active: number; messages: number; voiceMinutes: number; joins: number; leaves: number };

type Report = {
  grid: number[][];
  best: { day: number; hour: number; avg: number }[];
  channels: { id: string; messages: number }[];
  activeNow: number;
  activeBefore: number;
  avgDaily: number;
  messages: number;
  voiceMinutes: number;
  joined: number;
  left: number;
  cohort: number;
  talked: number;
  stayed: number;
  daily: Day[];
  games: { key: string; name: string; players: number; returned: number; plays: number }[];
  trackingSince: string | null;
};

export type InsightsData = { allowed: true; days: number; timezone: string; report: Report };

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Validated with the dataviz palette checker against the dashboard's dark surface.
const HEAT = ["#2a4a80", "#3060a8", "#3a7ad0", "#5a9bef", "#a3c8f7"];
const JOIN_COLOR = "#3987e5";
const LEAVE_COLOR = "#d95926";

const fmt = (value: number) => Math.round(value).toLocaleString();
const pct = (part: number, whole: number) => (whole ? `${Math.round((100 * part) / whole)}%` : "–");
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">{title}</h2>
      <div className="mt-5">{children}</div>
      {note ? <p className="mt-4 text-xs leading-5 text-slate-500">{note}</p> : null}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {sub ? <p className="mt-2 text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}

function Heatmap({ grid, weeks }: { grid: number[][]; weeks: number }) {
  const peak = Math.max(1, ...grid.flat());
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const step = (value: number) => (value <= 0 ? -1 : Math.min(HEAT.length - 1, Math.floor((value / peak) * HEAT.length)));

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-[2px]">
            {grid.map((row, d) => (
              <div key={d} className="contents">
                <div className="flex items-center text-xs text-slate-400">{DAY_NAMES[d]}</div>
                {row.map((value, h) => {
                  const s = step(value);
                  return (
                    <button
                      key={h}
                      type="button"
                      aria-label={`${DAY_NAMES[d]} ${hourLabel(h)}: about ${fmt(value / weeks)} messages a week`}
                      onMouseEnter={() => setHover({ d, h })}
                      onFocus={() => setHover({ d, h })}
                      onMouseLeave={() => setHover(null)}
                      className={`aspect-square rounded-[4px] outline-none ring-white/70 focus:ring-2 ${hover?.d === d && hover?.h === h ? "ring-2" : ""}`}
                      style={{ background: s < 0 ? "rgba(255,255,255,0.04)" : HEAT[s] }}
                    />
                  );
                })}
              </div>
            ))}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="pt-1 text-center text-[10px] text-slate-500">{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span className="min-h-[1rem]">
          {hover
            ? `${DAY_NAMES[hover.d]} ${hourLabel(hover.h)}–${hourLabel((hover.h + 1) % 24)} · about ${fmt(grid[hover.d][hover.h] / weeks)} messages a week`
            : "Hover a square for its numbers."}
        </span>
        <span className="flex items-center gap-1">
          Fewer
          {HEAT.map((color) => <span key={color} className="h-3 w-3 rounded-[3px]" style={{ background: color }} />)}
          More
        </span>
      </div>
    </div>
  );
}

function ActiveChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // A narrow drawing area, so the axis text stays readable once the chart is scaled to fit.
  const width = 480;
  const height = 200;
  const pad = { left: 34, right: 10, top: 12, bottom: 26 };
  const peak = Math.max(1, ...days.map((day) => day.active));
  const x = (i: number) => pad.left + (days.length <= 1 ? 0 : (i / (days.length - 1)) * (width - pad.left - pad.right));
  const y = (v: number) => pad.top + (1 - v / peak) * (height - pad.top - pad.bottom);
  const points = days.map((day, i) => `${x(i)},${y(day.active)}`).join(" ");
  const ticks = [0, Math.round(peak / 2), peak];
  const labelEvery = Math.max(1, Math.ceil(days.length / 4));

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Active members per day"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const px = ((event.clientX - box.left) / box.width) * width;
          const i = Math.round(((px - pad.left) / (width - pad.left - pad.right)) * (days.length - 1));
          setHover(Math.max(0, Math.min(days.length - 1, i)));
        }}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="rgba(255,255,255,0.08)" />
            <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="13" fill="#94a3b8">{tick}</text>
          </g>
        ))}
        {days.map((day, i) => (i % labelEvery === 0 ? (
          <text key={day.date} x={x(i)} y={height - 6} textAnchor="middle" fontSize="13" fill="#94a3b8">{shortDate(day.date)}</text>
        ) : null))}
        <polyline points={points} fill="none" stroke={JOIN_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={height - pad.bottom} stroke="rgba(255,255,255,0.25)" />
            <circle cx={x(hover)} cy={y(days[hover].active)} r="5" fill={JOIN_COLOR} stroke="#0d0f17" strokeWidth="2" />
          </g>
        ) : null}
      </svg>
      <p className="mt-2 min-h-[1rem] text-xs text-slate-400">
        {hover !== null
          ? `${shortDate(days[hover].date)} · ${days[hover].active} active · ${fmt(days[hover].messages)} messages · ${fmt(days[hover].voiceMinutes / 60)}h voice`
          : "Hover the chart for each day."}
      </p>
    </div>
  );
}

function JoinsChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const peak = Math.max(1, ...days.flatMap((day) => [day.joins, day.leaves]));

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs text-slate-300">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[3px]" style={{ background: JOIN_COLOR }} />Joined</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[3px]" style={{ background: LEAVE_COLOR }} />Left</span>
      </div>
      <div className="flex h-32 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {days.map((day, i) => (
          <div key={day.date} className="flex h-full flex-1 items-end justify-center gap-[2px]" onMouseEnter={() => setHover(i)}>
            <span className="w-1/2 max-w-[10px] rounded-t-[4px]" style={{ height: `${(day.joins / peak) * 100}%`, background: JOIN_COLOR, minHeight: day.joins ? 2 : 0 }} />
            <span className="w-1/2 max-w-[10px] rounded-t-[4px]" style={{ height: `${(day.leaves / peak) * 100}%`, background: LEAVE_COLOR, minHeight: day.leaves ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <p className="mt-2 min-h-[1rem] text-xs text-slate-400">
        {hover !== null ? `${shortDate(days[hover].date)} · ${days[hover].joins} joined · ${days[hover].leaves} left` : "Hover a day for its numbers."}
      </p>
    </div>
  );
}

export default function InsightsView({ guildId, initial }: { guildId: string; initial: InsightsData }) {
  const [data, setData] = useState(initial);
  const [days, setDays] = useState(initial.days);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [tzInput, setTzInput] = useState(initial.timezone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const channels = useDiscordChannels(guildId);
  const channelNames = useMemo(() => new Map(channels.items.map((channel) => [channel.id, channel.name])), [channels.items]);

  const load = useCallback(
    async (nextDays: number, nextTimezone: string) => {
      try {
        const response = await fetch(
          `/api/servers/${encodeURIComponent(guildId)}/insights?days=${nextDays}&tz=${encodeURIComponent(nextTimezone)}`,
          { cache: "no-store" }
        );
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.allowed) throw new Error(body?.error ?? "Insights could not be loaded.");
        setData(body);
        setDays(nextDays);
        setTimezone(nextTimezone);
        setTzInput(nextTimezone);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Insights could not be loaded.");
      } finally {
        setLoading(false);
      }
    },
    [guildId]
  );

  function change(nextDays: number, nextTimezone: string) {
    setLoading(true);
    void load(nextDays, nextTimezone);
  }

  // The first load is in UTC; switch to the viewer's own time zone once the page is open.
  useEffect(() => {
    const local = browserTimeZone();
    if (local === initial.timezone) return;
    let cancelled = false;
    fetch(`/api/servers/${encodeURIComponent(guildId)}/insights?days=${initial.days}&tz=${encodeURIComponent(local)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (cancelled || !body?.allowed) return; // stay on UTC if the browser's zone isn't known
        setData(body);
        setTimezone(local);
        setTzInput(local);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [guildId, initial.days, initial.timezone]);

  const r = data.report;
  const weeks = Math.max(1, data.days / 7);
  const trend = r.activeBefore ? Math.round((100 * (r.activeNow - r.activeBefore)) / r.activeBefore) : null;
  const channelPeak = Math.max(1, ...r.channels.map((channel) => channel.messages));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-3xl border border-white/10 bg-black/30 p-4">
        <div className="flex gap-2" role="group" aria-label="Period">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => change(value, timezone)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${days === value ? "border-blue-400 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/50"}`}
            >
              Last {value} days
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (tzInput.trim()) change(days, tzInput.trim());
          }}
        >
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Time zone</span>
            <input value={tzInput} onChange={(event) => setTzInput(event.target.value)} className={`${inputClass} mt-1 py-2 text-sm`} />
          </label>
          <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-blue-400">
            Apply
          </button>
        </form>
        <span className="text-xs text-slate-500">{loading ? "Loading…" : `Showing ${data.timezone}`}</span>
      </div>

      {error ? <ErrorNotice>{error}</ErrorNotice> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active members" value={fmt(r.activeNow)} sub={trend === null ? undefined : `${trend >= 0 ? "+" : ""}${trend}% vs the ${data.days} days before`} />
        <Stat label="On an average day" value={fmt(r.avgDaily)} />
        <Stat label="Messages" value={fmt(r.messages)} sub={`${fmt(r.voiceMinutes / 60)}h in voice`} />
        <Stat label="Joined · left" value={`+${r.joined} · −${r.left}`} />
      </div>

      <Card
        title="When your server is busiest"
        note={r.best.length ? `Best times to host: ${r.best.map((slot) => `${DAY_NAMES[slot.day]} ${hourLabel(slot.hour)} (~${fmt(slot.avg)} messages)`).join(" · ")}` : "No messages counted in this period yet."}
      >
        <Heatmap grid={r.grid} weeks={weeks} />
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Active members per day" note="A member counts as active on a day they sent a message or spent time in voice. Days are in UTC.">
          <ActiveChart days={r.daily} />
        </Card>
        <Card title="Joins and leaves" note="Days are in UTC.">
          <JoinsChart days={r.daily} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="New-member retention">
          {r.cohort ? (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Chatted in week one" value={pct(r.talked, r.cohort)} sub={`${r.talked} of ${r.cohort}`} />
              <Stat label="Still here" value={pct(r.stayed, r.cohort)} sub={`${r.stayed} of ${r.cohort}`} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Not enough new members yet. This counts members who joined in the period and have been here at least a week.</p>
          )}
        </Card>

        <Card title="Busiest channels">
          {r.channels.length === 0 ? <p className="text-sm text-slate-500">No messages counted yet.</p> : (
            <ul className="space-y-2">
              {r.channels.map((channel) => (
                <li key={channel.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="relative overflow-hidden rounded-lg bg-white/[0.03] px-3 py-2">
                    <span className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${(channel.messages / channelPeak) * 100}%`, background: "rgba(57,135,229,0.25)" }} />
                    <span className="relative truncate text-slate-200">#{channelNames.get(channel.id) ?? channel.id}</span>
                  </span>
                  <span className="tabular-nums text-slate-300">{fmt(channel.messages)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Games that bring people back" note="Players who won or earned points in the game, and how many were active again within a week of first playing.">
        {r.games.length === 0 ? <p className="text-sm text-slate-500">No games played in this period.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr><th className="py-2 pr-3">Game</th><th className="py-2 pr-3">Players</th><th className="py-2 pr-3">Wins / rewards</th><th className="py-2">Came back</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {r.games.map((game) => (
                  <tr key={game.key}>
                    <td className="py-3 pr-3 font-semibold text-white">{game.name}</td>
                    <td className="py-3 pr-3 tabular-nums text-slate-300">{game.players}</td>
                    <td className="py-3 pr-3 tabular-nums text-slate-300">{game.plays}</td>
                    <td className="py-3 tabular-nums text-slate-200">{pct(game.returned, game.players)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div>
        <button type="button" onClick={() => setShowTable((value) => !value)} className="text-sm font-semibold text-blue-300 hover:text-blue-200">
          {showTable ? "Hide" : "Show"} the numbers for each day
        </button>
        {showTable ? (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr><th className="px-3 py-2">Day (UTC)</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">Messages</th><th className="px-3 py-2">Voice (h)</th><th className="px-3 py-2">Joined</th><th className="px-3 py-2">Left</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 tabular-nums text-slate-300">
                {[...r.daily].reverse().map((day) => (
                  <tr key={day.date}>
                    <td className="px-3 py-2">{shortDate(day.date)}</td>
                    <td className="px-3 py-2">{day.active}</td>
                    <td className="px-3 py-2">{fmt(day.messages)}</td>
                    <td className="px-3 py-2">{(day.voiceMinutes / 60).toFixed(1)}</td>
                    <td className="px-3 py-2">{day.joins}</td>
                    <td className="px-3 py-2">{day.leaves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        {r.trackingSince ? `Tracking since ${shortDate(r.trackingSince)}` : "Tracking just started"} · message counts only, never what
        people say · kept for 120 days.
      </p>
    </div>
  );
}
