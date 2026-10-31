"use client";

import { useState } from "react";
import {
  DiscordChannelSelect,
  useDiscordChannels,
  useDiscordRoles,
} from "@/components/DiscordResourceSelects";
import {
  Field,
  IdPicker,
  NumberInput,
  Panel,
  SaveButton,
  Toggle,
  inputClass,
  useDashboardRequest,
} from "@/components/DashboardForm";
import { ErrorNotice, SuccessNotice, formatDashboardDate } from "@/components/ServerReadOnlySection";

export type AutoModSettings = {
  enabled: boolean;
  block_spam: boolean;
  block_mass_mentions: boolean;
  mention_limit: number;
  block_invites: boolean;
  block_links: boolean;
  banned_words: string[];
  warn_threshold: number;
  timeout_minutes: number;
  exempt_role_ids: string[];
  exempt_channel_ids: string[];
  log_channel_id: string;
};

export type ModCase = {
  id: number;
  user_id: string;
  moderator_id: string | null;
  action: string;
  reason: string | null;
  duration_minutes: number | null;
  active: boolean;
  created_at: string;
};

const ACTION_STYLES: Record<string, string> = {
  warn: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  automod: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  timeout: "border-orange-300/30 bg-orange-300/10 text-orange-100",
  kick: "border-red-300/30 bg-red-400/10 text-red-100",
  ban: "border-red-400/40 bg-red-500/20 text-red-100",
};

function duration(minutes: number | null) {
  if (!minutes) return "";
  if (minutes % 1440 === 0) return ` · ${minutes / 1440}d`;
  if (minutes % 60 === 0) return ` · ${minutes / 60}h`;
  return ` · ${minutes}m`;
}

export default function ModerationManager({ guildId, initial, advancedAllowed, advancedPlan, lastThirtyDays, cases }: {
  guildId: string;
  initial: AutoModSettings;
  advancedAllowed: boolean;
  advancedPlan: string;
  lastThirtyDays: Record<string, number>;
  cases: ModCase[];
}) {
  const [settings, setSettings] = useState(initial);
  const [wordsText, setWordsText] = useState(initial.banned_words.join(", "));
  const channelsState = useDiscordChannels(guildId);
  const rolesState = useDiscordRoles(guildId);
  const { saving, error, success, send } = useDashboardRequest(guildId);
  const lock = advancedAllowed ? null : `${advancedPlan} plan`;

  function set<K extends keyof AutoModSettings>(key: K, value: AutoModSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const banned_words = wordsText.split(/[,\n]/).map((word) => word.trim()).filter(Boolean);
    const data = await send<{ settings: AutoModSettings }>(
      "moderation",
      "PATCH",
      { ...settings, banned_words },
      "Saved. AutoMod picks up changes within a minute."
    );
    if (data) {
      setSettings(data.settings);
      setWordsText(data.settings.banned_words.join(", "));
    }
  }

  const counts = [
    { label: "Warnings", value: (lastThirtyDays.warn ?? 0) + (lastThirtyDays.automod ?? 0) },
    { label: "Timeouts", value: lastThirtyDays.timeout ?? 0 },
    { label: "Kicks", value: lastThirtyDays.kick ?? 0 },
    { label: "Bans", value: lastThirtyDays.ban ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <Toggle
        label="AutoMod"
        description="Delete messages that break the rules below and warn the sender. Staff (Manage Messages or Administrator), bots, and the exempt roles and channels are never checked."
        checked={settings.enabled}
        disabled={saving}
        onChange={(value) => set("enabled", value)}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Basic rules" description="Included on every plan.">
          <Toggle label="Spam" description="Lots of messages in a few seconds, or the same message repeated." checked={settings.block_spam} disabled={saving} onChange={(value) => set("block_spam", value)} />
          <Toggle label="Mass mentions" description="Too many people or roles mentioned in one message." checked={settings.block_mass_mentions} disabled={saving} onChange={(value) => set("block_mass_mentions", value)} />
          <Field label="Mentions allowed in one message" hint="AutoMod steps in at this many (2–50). @everyone counts as the whole limit.">
            <NumberInput value={settings.mention_limit} min={2} max={50} disabled={saving || !settings.block_mass_mentions} onChange={(value) => set("mention_limit", value)} />
          </Field>
          <Toggle label="Discord invites" description="Links to other Discord servers." checked={settings.block_invites} disabled={saving} onChange={(value) => set("block_invites", value)} />
        </Panel>

        <Panel title="Advanced rules" locked={lock} description={advancedAllowed ? "Banned words, links and automatic timeouts." : `These are included from the ${advancedPlan} plan. You can still switch off anything that's already on.`}>
          <Toggle label="All links" description="Any web link, not just Discord invites." checked={settings.block_links} disabled={saving || (!advancedAllowed && !settings.block_links)} onChange={(value) => set("block_links", value)} />
          <Field label="Banned words" hint="Separate with commas. Matches whole words, ignoring capital letters. Up to 500.">
            <textarea value={wordsText} rows={3} disabled={saving} onChange={(event) => setWordsText(event.target.value)} className={inputClass} placeholder="word1, word2" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Auto-timeout after" hint="Warnings within 24 hours. 0 = off.">
              <NumberInput value={settings.warn_threshold} min={0} max={20} disabled={saving || (!advancedAllowed && settings.warn_threshold === 0)} onChange={(value) => set("warn_threshold", value)} />
            </Field>
            <Field label="Timeout length (minutes)" hint="1 minute to 28 days (40,320).">
              <NumberInput value={settings.timeout_minutes} min={1} max={40320} disabled={saving || !advancedAllowed || settings.warn_threshold === 0} onChange={(value) => set("timeout_minutes", value)} />
            </Field>
          </div>
        </Panel>
      </div>

      <Panel title="Exceptions and logging">
        <div className="grid gap-5 lg:grid-cols-2">
          <IdPicker label="Exempt roles" kind="role" items={rolesState.items} isLoading={rolesState.isLoading} value={settings.exempt_role_ids} disabled={saving} onChange={(value) => set("exempt_role_ids", value)} />
          <IdPicker label="Exempt channels" kind="channel" items={channelsState.items} isLoading={channelsState.isLoading} value={settings.exempt_channel_ids} disabled={saving} onChange={(value) => set("exempt_channel_ids", value)} />
        </div>
        <DiscordChannelSelect
          guildId={guildId}
          channelsState={channelsState}
          label="Mod log channel"
          placeholder="Don't log"
          helperText="Every moderation and AutoMod action is posted here. Same as /mod logchannel."
          value={settings.log_channel_id}
          disabled={saving}
          onChange={(value) => set("log_channel_id", value)}
        />
      </Panel>

      <SaveButton saving={saving} onClick={save} />

      <Panel title="Moderation history" description="Commands like /mod warn, timeout, kick and ban, and AutoMod's own warnings. The latest 50 are shown.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts.map((count) => (
            <div key={count.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-2xl font-bold text-white">{count.value}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{count.label} · 30 days</p>
            </div>
          ))}
        </div>

        {cases.length === 0 ? (
          <p className="text-sm text-slate-500">No moderation actions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Case</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Member</th>
                  <th className="py-2 pr-3">By</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cases.map((item) => (
                  <tr key={item.id} className={item.active ? "" : "opacity-50"}>
                    <td className="py-3 pr-3 font-mono text-slate-400">#{item.id}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACTION_STYLES[item.action] ?? "border-white/10 bg-white/5 text-slate-200"}`}>
                        {item.action}{duration(item.duration_minutes)}
                      </span>
                      {item.active ? null : <span className="ml-2 text-xs text-slate-500">cleared</span>}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-slate-300">{item.user_id}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-slate-400">{item.moderator_id ?? "AutoMod"}</td>
                    <td className="max-w-xs py-3 pr-3 text-slate-300">{item.reason ?? <span className="text-slate-600">No reason</span>}</td>
                    <td className="py-3 text-slate-400">{formatDashboardDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">Members are shown by Discord user ID. In Discord, /mod warnings shows a member&apos;s history by name.</p>
      </Panel>
    </div>
  );
}
