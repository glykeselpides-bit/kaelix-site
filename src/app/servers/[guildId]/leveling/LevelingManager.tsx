"use client";

import { useState } from "react";
import {
  DiscordChannelSelect,
  DiscordRoleSelect,
  useDiscordChannels,
  useDiscordRoles,
  type DiscordChannel,
  type DiscordRole,
} from "@/components/DiscordResourceSelects";
import {
  Field,
  NumberInput,
  Panel,
  SaveButton,
  SmallButton,
  Toggle,
  inputClass,
  useDashboardRequest,
} from "@/components/DashboardForm";
import { ErrorNotice, SuccessNotice } from "@/components/ServerReadOnlySection";

export type LevelingSettings = {
  announce: boolean;
  levelup_channel_id: string;
  levelup_message: string;
  stack_rewards: boolean;
  role_multipliers: Record<string, number>;
  channel_multipliers: Record<string, number>;
  anti_farm: boolean;
  min_message_length: number;
};

export type RoleReward = { id: number; level: number; role_id: string };

function BoostList({ label, kind, items, isLoading, value, disabled, onChange }: {
  label: string;
  kind: "role" | "channel";
  items: (DiscordRole | DiscordChannel)[];
  isLoading: boolean;
  value: Record<string, number>;
  disabled: boolean;
  onChange: (value: Record<string, number>) => void;
}) {
  const [pick, setPick] = useState("");
  const [amount, setAmount] = useState(1.5);
  const names = new Map(items.map((item) => [item.id, item.name]));
  const prefix = kind === "channel" ? "#" : "@";
  const entries = Object.entries(value);

  return (
    <div className="space-y-3">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {entries.length === 0 ? <p className="text-sm text-slate-500">No boosts.</p> : null}
      {entries.map(([id, multiplier]) => (
        <div key={id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm">
          <span className="text-slate-200">{prefix}{names.get(id) ?? id}</span>
          <span className="flex items-center gap-3">
            <span className="font-semibold text-blue-200">{multiplier === 0 ? "no XP" : `×${multiplier}`}</span>
            <SmallButton tone="danger" disabled={disabled} onClick={() => {
              const next = { ...value };
              delete next[id];
              onChange(next);
            }}>Remove</SmallButton>
          </span>
        </div>
      ))}
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
        <select value={pick} disabled={disabled || isLoading} onChange={(event) => setPick(event.target.value)} className={inputClass}>
          <option value="">{isLoading ? "Loading..." : `Choose a ${kind}`}</option>
          {items.filter((item) => !(item.id in value)).map((item) => (
            <option key={item.id} value={item.id}>{prefix}{item.name}</option>
          ))}
        </select>
        <NumberInput value={amount} min={0} max={5} step={0.1} disabled={disabled} onChange={setAmount} />
        <SmallButton tone="primary" disabled={disabled || !pick || !Number.isFinite(amount) || amount < 0 || amount > 5 || amount === 1} onClick={() => {
          onChange({ ...value, [pick]: Math.round(amount * 100) / 100 });
          setPick("");
        }}>Add boost</SmallButton>
      </div>
      <p className="text-xs text-slate-500">0 to 5. 1.5 = 50% more XP, 0 = no XP at all.{kind === "role" ? " Members with several boosted roles get the highest." : ""}</p>
    </div>
  );
}

export default function LevelingManager({ guildId, initial, initialRewards, maxRewards }: {
  guildId: string;
  initial: LevelingSettings;
  initialRewards: RoleReward[];
  maxRewards: number;
}) {
  const [settings, setSettings] = useState(initial);
  const [rewards, setRewards] = useState(initialRewards);
  const [newRole, setNewRole] = useState("");
  const [newLevel, setNewLevel] = useState(5);
  const channelsState = useDiscordChannels(guildId);
  const rolesState = useDiscordRoles(guildId);
  const { saving, error, success, send } = useDashboardRequest(guildId);
  const roleNames = new Map(rolesState.items.map((role) => [role.id, role.name]));

  function set<K extends keyof LevelingSettings>(key: K, value: LevelingSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const data = await send<{ settings: LevelingSettings }>("leveling", "PATCH", settings, "Saved. Kaelix uses the new settings within a minute.");
    if (data) setSettings(data.settings);
  }

  async function addReward() {
    const data = await send<{ rewards: RoleReward[] }>("leveling", "POST", { role_id: newRole, level: newLevel }, "Role reward saved.");
    if (data) {
      setRewards(data.rewards);
      setNewRole("");
    }
  }

  async function removeReward(id: number) {
    const data = await send<{ rewards: RoleReward[] }>(`leveling?id=${id}`, "DELETE", undefined, "Role reward removed.");
    if (data) setRewards(data.rewards);
  }

  const sample = (settings.levelup_message || "")
    .replaceAll("{user}", "@Alex")
    .replaceAll("{username}", "Alex")
    .replaceAll("{level}", "5")
    .replaceAll("{server}", "Your Server")
    .replaceAll("**", "");

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <Panel title="Role rewards" description={`Members get these roles automatically when they reach the level. Up to ${maxRewards}. Kaelix's role must be above them in Server Settings → Roles.`}>
        {rewards.length === 0 ? <p className="text-sm text-slate-500">No role rewards yet.</p> : null}
        <div className="space-y-2">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
              <span>
                <span className="font-semibold text-white">Level {reward.level}</span>
                <span className="ml-3 text-slate-300">@{roleNames.get(reward.role_id) ?? reward.role_id}</span>
              </span>
              <SmallButton tone="danger" disabled={saving} onClick={() => removeReward(reward.id)}>Remove</SmallButton>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <DiscordRoleSelect guildId={guildId} rolesState={rolesState} label="Role" value={newRole} disabled={saving} helperText="" onChange={setNewRole} />
          <Field label="At level">
            <NumberInput value={newLevel} min={1} max={500} disabled={saving} onChange={setNewLevel} />
          </Field>
          <SmallButton tone="primary" disabled={saving || !newRole || !Number.isInteger(newLevel) || newLevel < 1 || newLevel > 500} onClick={addReward}>
            Add reward
          </SmallButton>
        </div>
        <p className="text-xs text-slate-500">
          Picking a role that&apos;s already a reward moves it to the new level. To give new rewards to members who
          already passed that level, run /leveling sync in Discord.
        </p>
        <Toggle
          label="Keep every reward role"
          description="On: members keep all the reward roles they've earned. Off: they only keep the highest one."
          checked={settings.stack_rewards}
          disabled={saving}
          onChange={(value) => set("stack_rewards", value)}
        />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Level-up messages">
          <Toggle label="Announce level-ups" checked={settings.announce} disabled={saving} onChange={(value) => set("announce", value)} />
          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Channel"
            placeholder="Where they leveled up"
            helperText="Leave empty to announce in the channel where they leveled up."
            value={settings.levelup_channel_id}
            disabled={saving || !settings.announce}
            onChange={(value) => set("levelup_channel_id", value)}
          />
          <Field label="Message" hint="{user} mentions them · {username} · {level} · {server}. Leave empty for the standard Kaelix embed.">
            <textarea value={settings.levelup_message} maxLength={500} rows={3} disabled={saving || !settings.announce} onChange={(event) => set("levelup_message", event.target.value)} className={inputClass} placeholder="🎉 {user} reached **Level {level}**!" />
          </Field>
          {sample ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-300">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</span>
              <p className="mt-2 whitespace-pre-wrap">{sample}</p>
            </div>
          ) : null}
        </Panel>

        <Panel title="Anti-farming">
          <Toggle
            label="Stop XP farming"
            description="Short and repeated messages earn nothing. Voice only counts with another person in the channel, and not while deafened."
            checked={settings.anti_farm}
            disabled={saving}
            onChange={(value) => set("anti_farm", value)}
          />
          <Field label="Shortest message that earns XP" hint="In characters, 1–50.">
            <NumberInput value={settings.min_message_length} min={1} max={50} disabled={saving || !settings.anti_farm} onChange={(value) => set("min_message_length", value)} />
          </Field>
        </Panel>
      </div>

      <Panel title="XP boosts">
        <div className="grid gap-6 lg:grid-cols-2">
          <BoostList label="Roles" kind="role" items={rolesState.items} isLoading={rolesState.isLoading} value={settings.role_multipliers} disabled={saving} onChange={(value) => set("role_multipliers", value)} />
          <BoostList label="Channels" kind="channel" items={channelsState.items} isLoading={channelsState.isLoading} value={settings.channel_multipliers} disabled={saving} onChange={(value) => set("channel_multipliers", value)} />
        </div>
      </Panel>

      <SaveButton saving={saving} onClick={save} />
      <p className="text-xs text-slate-500">Role rewards save straight away. Everything else saves with this button.</p>
    </div>
  );
}
