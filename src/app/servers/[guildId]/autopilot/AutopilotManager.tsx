"use client";

import { useState } from "react";
import {
  DiscordChannelSelect,
  DiscordRoleSelect,
  useDiscordChannels,
  useDiscordRoles,
} from "@/components/DiscordResourceSelects";
import {
  Field,
  NumberInput,
  Panel,
  SaveButton,
  SmallButton,
  inputClass,
  useDashboardRequest,
} from "@/components/DashboardForm";
import { ErrorNotice, SuccessNotice, formatDashboardDate } from "@/components/ServerReadOnlySection";
import { DAYS } from "@/lib/autopilotGames";

type Game = {
  key: string;
  name: string;
  style: "timed" | "lobby" | "open" | "phased";
  closesAfter: number | null;
  allowed: boolean;
  plan: string;
};

type Schedule = {
  id: number;
  game: string;
  gameName: string;
  when: string;
  channel_id: string;
  title: string | null;
  ping_role_id: string | null;
  remind_minutes: number;
  trivia_mode: string;
  run_minutes: number;
  options: { submission_hours: number | null; voting_hours: number | null; reward: number | null; themes: string[] };
  enabled: boolean;
  last_run_at: string | null;
  status: string;
};

export type AutopilotData = {
  plan: string;
  planLabel: string;
  limit: number;
  imagesCount: number;
  schedules: Schedule[];
  games: Game[];
};

const STYLE_HELP: Record<Game["style"], string> = {
  timed: "Runs and finishes by itself.",
  lobby: "Opens a lobby and begins after a few minutes. If too few people join, the lobby closes.",
  open: "Stays open for a while, then Autopilot closes it and reveals the answer.",
  phased: "Members submit, then vote. You set how long each part lasts and the winner's points.",
};

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  paused: "border-white/10 bg-white/5 text-slate-300",
};

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const emptyForm = () => ({
  game: "",
  weekday: -1,
  time: "20:00",
  timezone: browserTimeZone(),
  channel_id: "",
  title: "",
  ping_role_id: "",
  remind_minutes: 0,
  trivia_mode: "individual",
  runs_for: Number.NaN,
  submission_hours: 1,
  voting_hours: 1,
  reward: 50,
  themes: "",
});

export default function AutopilotManager({ guildId, initial }: { guildId: string; initial: AutopilotData }) {
  const [data, setData] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const channelsState = useDiscordChannels(guildId);
  const rolesState = useDiscordRoles(guildId);
  const { saving, error, success, send } = useDashboardRequest(guildId);
  const channelNames = new Map(channelsState.items.map((channel) => [channel.id, channel.name]));

  const game = data.games.find((item) => item.key === form.game);
  const full = data.limit >= 0 && data.schedules.length >= data.limit;

  function set<K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function add() {
    const body: Record<string, unknown> = {
      game: form.game,
      weekday: form.weekday,
      time: form.time,
      timezone: form.timezone.trim(),
      channel_id: form.channel_id,
      title: form.title,
      ping_role_id: form.ping_role_id || null,
      remind_minutes: form.remind_minutes,
    };
    if (form.game === "trivia") body.trivia_mode = form.trivia_mode;
    if (game?.style === "open" && Number.isFinite(form.runs_for)) body.runs_for = form.runs_for;
    if (game?.style === "phased") {
      body.submission_hours = form.submission_hours;
      body.voting_hours = form.voting_hours;
      body.reward = form.reward;
    }
    if (form.game === "gif") body.themes = form.themes;

    const next = await send<AutopilotData>("autopilot", "POST", body, "Schedule added. Test it in Discord with /autopilot run.");
    if (next) {
      setData(next);
      setForm(emptyForm());
    }
  }

  async function toggle(schedule: Schedule) {
    const next = await send<AutopilotData>("autopilot", "PATCH", { id: schedule.id, enabled: !schedule.enabled },
      schedule.enabled ? `Paused #${schedule.id}.` : `Resumed #${schedule.id}.`);
    if (next) setData(next);
  }

  async function remove(schedule: Schedule) {
    const next = await send<AutopilotData>(`autopilot?id=${schedule.id}`, "DELETE", undefined, `Removed #${schedule.id}.`);
    if (next) setData(next);
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <Panel
        title="Schedules"
        description={`${data.schedules.length} of ${data.limit < 0 ? "unlimited" : data.limit} on the ${data.planLabel} plan. If there are more than the plan allows, the oldest ones keep running.`}
      >
        {data.schedules.length === 0 ? <p className="text-sm text-slate-500">No schedules yet. Add one below.</p> : null}
        <div className="space-y-3">
          {data.schedules.map((schedule) => {
            const extras = [
              schedule.trivia_mode === "faction" ? "Faction Battle" : null,
              schedule.options.submission_hours || schedule.options.voting_hours
                ? `${schedule.options.submission_hours ?? 1}h + ${schedule.options.voting_hours ?? 1}h voting`
                : null,
              schedule.options.reward ? `${schedule.options.reward} pts` : null,
              schedule.options.themes.length ? `${schedule.options.themes.length} theme${schedule.options.themes.length === 1 ? "" : "s"}` : null,
              schedule.run_minutes ? `closes after ${schedule.run_minutes} min` : null,
              schedule.remind_minutes ? `reminder ${schedule.remind_minutes} min before` : null,
            ].filter(Boolean);
            return (
              <div key={schedule.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    <span className="mr-2 font-mono text-xs text-slate-500">#{schedule.id}</span>
                    {schedule.title ? `${schedule.title} · ` : ""}{schedule.gameName}
                    <span className={`ml-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[schedule.status] ?? "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
                      {schedule.status.startsWith("needs") || schedule.status === "over limit" ? "\u{1F512} " : ""}{schedule.status}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {schedule.when} in #{channelNames.get(schedule.channel_id) ?? schedule.channel_id}
                    {extras.length ? ` · ${extras.join(" · ")}` : ""}
                  </p>
                  {schedule.last_run_at ? (
                    <p className="mt-1 text-xs text-slate-500">Last ran {formatDashboardDate(schedule.last_run_at)}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <SmallButton disabled={saving} onClick={() => toggle(schedule)}>{schedule.enabled ? "Pause" : "Resume"}</SmallButton>
                  <SmallButton tone="danger" disabled={saving} onClick={() => remove(schedule)}>Delete</SmallButton>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Add a schedule"
        locked={full ? "plan limit reached" : null}
        description={full ? `This server is using all ${data.limit} schedules on ${data.planLabel}. Delete one, or upgrade to Elite for unlimited.` : undefined}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Game" hint={game ? STYLE_HELP[game.style] : "Custom games you made with /game can be scheduled with /autopilot add in Discord."}>
            <select value={form.game} disabled={saving || full} onChange={(event) => set("game", event.target.value)} className={inputClass}>
              <option value="">Choose a game</option>
              {data.games.map((item) => (
                <option key={item.key} value={item.key} disabled={!item.allowed}>
                  {item.name}{item.allowed ? "" : ` (${item.plan} plan)`}
                </option>
              ))}
            </select>
          </Field>

          <DiscordChannelSelect guildId={guildId} channelsState={channelsState} label="Channel" value={form.channel_id} disabled={saving || full} onChange={(value) => set("channel_id", value)} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Day">
              <select value={form.weekday} disabled={saving || full} onChange={(event) => set("weekday", Number(event.target.value))} className={inputClass}>
                <option value={-1}>Every day</option>
                {DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </Field>
            <Field label="Time">
              <input type="time" value={form.time} disabled={saving || full} onChange={(event) => set("time", event.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Time zone" hint="e.g. Europe/London, America/New_York, Asia/Karachi. Filled in from your browser.">
            <input type="text" value={form.timezone} disabled={saving || full} onChange={(event) => set("timezone", event.target.value)} className={inputClass} />
          </Field>

          <Field label="Title (optional)" hint="e.g. Trivia Night. Shown in the announcement.">
            <input type="text" maxLength={100} value={form.title} disabled={saving || full} onChange={(event) => set("title", event.target.value)} className={inputClass} />
          </Field>

          <DiscordRoleSelect guildId={guildId} rolesState={rolesState} label="Ping a role (optional)" placeholder="No ping" helperText="" value={form.ping_role_id} disabled={saving || full} onChange={(value) => set("ping_role_id", value)} />

          <Field label="Reminder (minutes before)" hint="0 = no reminder. Up to 180.">
            <NumberInput value={form.remind_minutes} min={0} max={180} disabled={saving || full} onChange={(value) => set("remind_minutes", value)} />
          </Field>

          {form.game === "trivia" ? (
            <Field label="Trivia mode">
              <select value={form.trivia_mode} disabled={saving || full} onChange={(event) => set("trivia_mode", event.target.value)} className={inputClass}>
                <option value="individual">Individual</option>
                <option value="faction">Faction Battle</option>
              </select>
            </Field>
          ) : null}

          {game?.style === "open" ? (
            <Field label="Stays open for (minutes)" hint={`Leave empty for the default (${game.closesAfter} min). 5 to 1,440.`}>
              <NumberInput value={form.runs_for} min={5} max={1440} disabled={saving || full} onChange={(value) => set("runs_for", value)} />
            </Field>
          ) : null}

          {game?.style === "phased" ? (
            <div className="grid grid-cols-3 gap-4 lg:col-span-2">
              <Field label="Hours to submit"><NumberInput value={form.submission_hours} min={1} max={72} disabled={saving || full} onChange={(value) => set("submission_hours", value)} /></Field>
              <Field label="Hours to vote"><NumberInput value={form.voting_hours} min={1} max={72} disabled={saving || full} onChange={(value) => set("voting_hours", value)} /></Field>
              <Field label="Winner's points"><NumberInput value={form.reward} min={1} max={10000} disabled={saving || full} onChange={(value) => set("reward", value)} /></Field>
            </div>
          ) : null}

          {form.game === "gif" ? (
            <Field label="Themes" hint="One theme, or several separated by | to rotate through, e.g. Monday mood | Plot twist | Payday">
              <input type="text" value={form.themes} disabled={saving || full} onChange={(event) => set("themes", event.target.value)} className={inputClass} />
            </Field>
          ) : null}
        </div>

        {form.game === "caption" && data.imagesCount === 0 ? (
          <p className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
            Caption This needs images to pick from. Add some in Discord with /autopilot images add before it runs.
          </p>
        ) : null}

        <SaveButton saving={saving} onClick={add} label="Add schedule" disabled={full || !form.game || !form.channel_id} />
      </Panel>
    </div>
  );
}
