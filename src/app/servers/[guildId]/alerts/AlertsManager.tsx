"use client";

import { useState } from "react";
import {
  DiscordChannelSelect,
  DiscordRoleSelect,
  useDiscordChannels,
  useDiscordRoles,
} from "@/components/DiscordResourceSelects";
import { Field, Panel, SmallButton, inputClass, useDashboardRequest } from "@/components/DashboardForm";
import { ErrorNotice, SuccessNotice } from "@/components/ServerReadOnlySection";

type Alert = {
  id: number;
  platform: string;
  display_name: string;
  url: string | null;
  channel_id: string;
  ping_role_id: string;
  message: string;
  active: boolean;
};

export type AlertsData = {
  planLabel: string;
  limit: number;
  defaults: Record<string, string>;
  alerts: Alert[];
};

const PLATFORMS: Record<string, { label: string; color: string; vars: string }> = {
  twitch: { label: "Twitch", color: "border-violet-400/30 bg-violet-500/10 text-violet-100", vars: "{name} {title} {link} {game}" },
  kick: { label: "Kick", color: "border-lime-400/30 bg-lime-500/10 text-lime-100", vars: "{name} {title} {link} {game}" },
  youtube: { label: "YouTube", color: "border-red-400/30 bg-red-500/10 text-red-100", vars: "{name} {title} {link}" },
};

export default function AlertsManager({ guildId, initial }: { guildId: string; initial: AlertsData }) {
  const [data, setData] = useState(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Alert | null>(null);
  const channelsState = useDiscordChannels(guildId);
  const rolesState = useDiscordRoles(guildId);
  const { saving, error, success, send } = useDashboardRequest(guildId);
  const channelNames = new Map(channelsState.items.map((channel) => [channel.id, channel.name]));
  const roleNames = new Map(rolesState.items.map((role) => [role.id, role.name]));

  function startEdit(alert: Alert) {
    setEditing(alert.id);
    setDraft({ ...alert });
  }

  async function save() {
    if (!draft) return;
    const next = await send<AlertsData>("alerts", "PATCH", {
      id: draft.id,
      channel_id: draft.channel_id,
      ping_role_id: draft.ping_role_id || null,
      message: draft.message,
    }, "Alert saved.");
    if (next) {
      setData(next);
      setEditing(null);
      setDraft(null);
    }
  }

  async function remove(alert: Alert) {
    const next = await send<AlertsData>(`alerts?id=${alert.id}`, "DELETE", undefined, `Removed ${alert.display_name}.`);
    if (next) setData(next);
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <Panel
        title="Followed channels"
        description={`${data.alerts.length} of ${data.limit < 0 ? "unlimited" : data.limit} on the ${data.planLabel} plan. Kaelix checks every few minutes.`}
      >
        {data.alerts.length === 0 ? <p className="text-sm text-slate-500">No alerts yet.</p> : null}

        <div className="space-y-3">
          {data.alerts.map((alert) => {
            const platform = PLATFORMS[alert.platform] ?? { label: alert.platform, color: "border-white/10 bg-white/5 text-slate-200", vars: "{name}" };
            const isEditing = editing === alert.id && draft;
            return (
              <div key={alert.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      <span className={`mr-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${platform.color}`}>{platform.label}</span>
                      {alert.url ? (
                        <a href={alert.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300">{alert.display_name}</a>
                      ) : alert.display_name}
                      {alert.active ? null : (
                        <span className="ml-3 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-xs font-semibold text-amber-100">
                          {"\u{1F512}"} over your plan&apos;s limit
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Posts in #{channelNames.get(alert.channel_id) ?? alert.channel_id}
                      {alert.ping_role_id ? ` · pings @${roleNames.get(alert.ping_role_id) ?? alert.ping_role_id}` : ""}
                      {alert.message ? " · custom message" : ""}
                    </p>
                  </div>
                  {isEditing ? null : (
                    <div className="flex shrink-0 gap-2">
                      <SmallButton disabled={saving} onClick={() => startEdit(alert)}>Edit</SmallButton>
                      <SmallButton tone="danger" disabled={saving} onClick={() => remove(alert)}>Remove</SmallButton>
                    </div>
                  )}
                </div>

                {isEditing && draft ? (
                  <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <DiscordChannelSelect guildId={guildId} channelsState={channelsState} label="Channel" value={draft.channel_id} disabled={saving} onChange={(value) => setDraft({ ...draft, channel_id: value })} />
                      <DiscordRoleSelect guildId={guildId} rolesState={rolesState} label="Ping a role" placeholder="No ping" helperText="" value={draft.ping_role_id} disabled={saving} onChange={(value) => setDraft({ ...draft, ping_role_id: value })} />
                    </div>
                    <Field label="Message" hint={`Leave empty for the standard one. Variables: ${platform.vars}`}>
                      <textarea
                        value={draft.message}
                        maxLength={500}
                        rows={2}
                        disabled={saving}
                        placeholder={data.defaults[alert.platform] ?? ""}
                        onChange={(event) => setDraft({ ...draft, message: event.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <div className="flex gap-2">
                      <SmallButton tone="primary" disabled={saving || !draft.channel_id} onClick={save}>{saving ? "Saving..." : "Save"}</SmallButton>
                      <SmallButton disabled={saving} onClick={() => { setEditing(null); setDraft(null); }}>Cancel</SmallButton>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Adding a channel">
        <p className="text-sm leading-6 text-slate-300">
          Add new alerts in Discord with <span className="font-semibold text-white">/alerts add</span>, giving a Twitch or
          Kick username, or a YouTube @handle or channel link. Kaelix looks the channel up when you add it, so it can
          tell you straight away if the name is wrong. Once added, it shows up here to edit. Use{" "}
          <span className="font-semibold text-white">/alerts test</span> to see what an alert looks like.
        </p>
      </Panel>
    </div>
  );
}
