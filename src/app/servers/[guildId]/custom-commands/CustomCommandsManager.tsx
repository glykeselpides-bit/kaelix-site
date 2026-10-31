"use client";

import { useState } from "react";
import { DiscordRoleSelect, useDiscordRoles } from "@/components/DiscordResourceSelects";
import { Field, Panel, SaveButton, SmallButton, inputClass, useDashboardRequest } from "@/components/DashboardForm";
import { ErrorNotice, SuccessNotice } from "@/components/ServerReadOnlySection";

type Command = { id: number; name: string; response: string; role_id: string; uses: number; active: boolean };
type Responder = { id: number; trigger: string; match: string; response: string; uses: number; active: boolean };

export type CustomCommandsData = {
  planLabel: string;
  roleActions: boolean;
  rolePlan: string;
  limits: { commands: number; responders: number };
  commands: Command[];
  responders: Responder[];
};

const MATCH_LABELS: Record<string, string> = {
  contains: "Message contains it",
  starts: "Message starts with it",
  exact: "Message is exactly it",
};

const VARIABLES = "{user} mentions them · {username} their name · {server} the server name · {count} member count";

function limitText(used: number, limit: number) {
  return `${used} of ${limit < 0 ? "unlimited" : limit}`;
}

function Paused() {
  return (
    <span className="ml-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-xs font-semibold text-amber-100">
      {"\u{1F512}"} paused: over your plan&apos;s limit
    </span>
  );
}

export default function CustomCommandsManager({ guildId, initial }: { guildId: string; initial: CustomCommandsData }) {
  const [data, setData] = useState(initial);
  const [newCommand, setNewCommand] = useState({ name: "", response: "", role_id: "" });
  const [newResponder, setNewResponder] = useState({ trigger: "", match: "contains", response: "" });
  const [editing, setEditing] = useState<{ kind: "command"; row: Command } | { kind: "responder"; row: Responder } | null>(null);
  const rolesState = useDiscordRoles(guildId);
  const roleNames = new Map(rolesState.items.map((role) => [role.id, role.name]));
  const { saving, error, success, send } = useDashboardRequest(guildId);

  const commandsFull = data.limits.commands >= 0 && data.commands.length >= data.limits.commands;
  const respondersFull = data.limits.responders >= 0 && data.responders.length >= data.limits.responders;

  async function run(method: string, body: unknown, text: string, path = "custom-commands") {
    const next = await send<CustomCommandsData>(path, method, body, text);
    if (next) setData(next);
    return Boolean(next);
  }

  async function createCommand() {
    const ok = await run("POST", { kind: "command", ...newCommand, role_id: newCommand.role_id || null },
      `Created !${newCommand.name.toLowerCase().replace(/^!+/, "")}. Members can use it within a minute.`);
    if (ok) setNewCommand({ name: "", response: "", role_id: "" });
  }

  async function createResponder() {
    const ok = await run("POST", { kind: "responder", ...newResponder }, "Auto-responder added. It starts working within a minute.");
    if (ok) setNewResponder({ trigger: "", match: "contains", response: "" });
  }

  async function saveEdit() {
    if (!editing) return;
    const body = editing.kind === "command"
      ? { kind: "command", id: editing.row.id, response: editing.row.response, role_id: editing.row.role_id || null }
      : { kind: "responder", id: editing.row.id, trigger: editing.row.trigger, match: editing.row.match, response: editing.row.response };
    if (await run("PATCH", body, "Saved.")) setEditing(null);
  }

  async function remove(kind: "command" | "responder", id: number, label: string) {
    await run("DELETE", undefined, `Deleted ${label}.`, `custom-commands?kind=${kind}&id=${id}`);
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <Panel
        title="Custom commands"
        description={`Members type !name and Kaelix replies. ${limitText(data.commands.length, data.limits.commands)} on the ${data.planLabel} plan.`}
      >
        {data.commands.length === 0 ? <p className="text-sm text-slate-500">No custom commands yet.</p> : null}
        <div className="space-y-3">
          {data.commands.map((command) => {
            const isEditing = editing?.kind === "command" && editing.row.id === command.id;
            return (
              <div key={command.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-blue-200">
                      !{command.name}
                      {command.active ? null : <Paused />}
                    </p>
                    {!isEditing ? (
                      <>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">{command.response}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          Used {command.uses}×
                          {command.role_id ? ` · gives or takes @${roleNames.get(command.role_id) ?? command.role_id}` : ""}
                        </p>
                      </>
                    ) : null}
                  </div>
                  {!isEditing ? (
                    <div className="flex shrink-0 gap-2">
                      <SmallButton disabled={saving} onClick={() => setEditing({ kind: "command", row: { ...command } })}>Edit</SmallButton>
                      <SmallButton tone="danger" disabled={saving} onClick={() => remove("command", command.id, `!${command.name}`)}>Delete</SmallButton>
                    </div>
                  ) : null}
                </div>
                {isEditing && editing?.kind === "command" ? (
                  <div className="mt-4 space-y-4">
                    <Field label="Reply" hint={VARIABLES}>
                      <textarea rows={3} maxLength={2000} value={editing.row.response} disabled={saving}
                        onChange={(event) => setEditing({ kind: "command", row: { ...editing.row, response: event.target.value } })} className={inputClass} />
                    </Field>
                    <DiscordRoleSelect guildId={guildId} rolesState={rolesState} label={`Give or take a role (${data.rolePlan})`} placeholder="No role"
                      helperText={data.roleActions ? "Using the command gives the role, or takes it away if they already have it." : `Included from the ${data.rolePlan} plan. You can still remove a role that's set.`}
                      value={editing.row.role_id} disabled={saving || (!data.roleActions && !editing.row.role_id)}
                      onChange={(value) => setEditing({ kind: "command", row: { ...editing.row, role_id: value } })} />
                    <div className="flex gap-2">
                      <SmallButton tone="primary" disabled={saving || !editing.row.response.trim()} onClick={saveEdit}>{saving ? "Saving..." : "Save"}</SmallButton>
                      <SmallButton disabled={saving} onClick={() => setEditing(null)}>Cancel</SmallButton>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 border-t border-white/10 pt-5">
          <p className="text-sm font-semibold text-white">Add a command</p>
          {commandsFull ? (
            <p className="text-sm text-amber-100">This server is using all {data.limits.commands} custom commands on {data.planLabel}. Delete one, or upgrade to Pro for unlimited.</p>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Name" hint="What members type after !. Letters, numbers, - and _ (up to 32).">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 text-slate-500">!</span>
                <input value={newCommand.name} maxLength={33} disabled={saving || commandsFull} placeholder="rules"
                  onChange={(event) => setNewCommand({ ...newCommand, name: event.target.value })} className={`${inputClass} pl-7`} />
              </div>
            </Field>
            <DiscordRoleSelect guildId={guildId} rolesState={rolesState} label={`Give or take a role (${data.rolePlan}, optional)`} placeholder="No role"
              helperText={data.roleActions ? "Kaelix's role must be above it in Server Settings → Roles." : `Included from the ${data.rolePlan} plan.`}
              value={newCommand.role_id} disabled={saving || commandsFull || !data.roleActions}
              onChange={(value) => setNewCommand({ ...newCommand, role_id: value })} />
          </div>
          <Field label="Reply" hint={VARIABLES}>
            <textarea rows={3} maxLength={2000} value={newCommand.response} disabled={saving || commandsFull} placeholder="Read the rules in #rules, {user}!"
              onChange={(event) => setNewCommand({ ...newCommand, response: event.target.value })} className={inputClass} />
          </Field>
          <SaveButton saving={saving} onClick={createCommand} label="Create command" disabled={commandsFull || !newCommand.name.trim() || !newCommand.response.trim()} />
        </div>
      </Panel>

      <Panel
        title="Auto-responders"
        description={`Kaelix replies when a message matches a trigger, at most once every 15 seconds per channel. ${limitText(data.responders.length, data.limits.responders)} on the ${data.planLabel} plan.`}
      >
        {data.responders.length === 0 ? <p className="text-sm text-slate-500">No auto-responders yet.</p> : null}
        <div className="space-y-3">
          {data.responders.map((responder) => {
            const isEditing = editing?.kind === "responder" && editing.row.id === responder.id;
            return (
              <div key={responder.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                {!isEditing ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">
                        <span className="mr-2 font-mono text-xs text-slate-500">#{responder.id}</span>
                        &ldquo;{responder.trigger}&rdquo;
                        <span className="ml-2 text-xs font-normal text-slate-400">{MATCH_LABELS[responder.match] ?? responder.match}</span>
                        {responder.active ? null : <Paused />}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">{responder.response}</p>
                      <p className="mt-2 text-xs text-slate-500">Used {responder.uses}×</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <SmallButton disabled={saving} onClick={() => setEditing({ kind: "responder", row: { ...responder } })}>Edit</SmallButton>
                      <SmallButton tone="danger" disabled={saving} onClick={() => remove("responder", responder.id, `auto-responder #${responder.id}`)}>Delete</SmallButton>
                    </div>
                  </div>
                ) : editing?.kind === "responder" ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Field label="Trigger">
                        <input value={editing.row.trigger} maxLength={100} disabled={saving}
                          onChange={(event) => setEditing({ kind: "responder", row: { ...editing.row, trigger: event.target.value } })} className={inputClass} />
                      </Field>
                      <Field label="Match">
                        <select value={editing.row.match} disabled={saving}
                          onChange={(event) => setEditing({ kind: "responder", row: { ...editing.row, match: event.target.value } })} className={inputClass}>
                          {Object.entries(MATCH_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Reply" hint={VARIABLES}>
                      <textarea rows={3} maxLength={2000} value={editing.row.response} disabled={saving}
                        onChange={(event) => setEditing({ kind: "responder", row: { ...editing.row, response: event.target.value } })} className={inputClass} />
                    </Field>
                    <div className="flex gap-2">
                      <SmallButton tone="primary" disabled={saving || editing.row.trigger.trim().length < 2 || !editing.row.response.trim()} onClick={saveEdit}>{saving ? "Saving..." : "Save"}</SmallButton>
                      <SmallButton disabled={saving} onClick={() => setEditing(null)}>Cancel</SmallButton>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 border-t border-white/10 pt-5">
          <p className="text-sm font-semibold text-white">Add an auto-responder</p>
          {respondersFull ? (
            <p className="text-sm text-amber-100">This server is using all {data.limits.responders} auto-responders on {data.planLabel}. Delete one, or upgrade to Pro for unlimited.</p>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Trigger" hint="A word or phrase, 2–100 characters. Capital letters don't matter.">
              <input value={newResponder.trigger} maxLength={100} disabled={saving || respondersFull} placeholder="how do I join"
                onChange={(event) => setNewResponder({ ...newResponder, trigger: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Match" hint="'Contains' matches whole words anywhere in the message.">
              <select value={newResponder.match} disabled={saving || respondersFull}
                onChange={(event) => setNewResponder({ ...newResponder, match: event.target.value })} className={inputClass}>
                {Object.entries(MATCH_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Reply" hint={VARIABLES}>
            <textarea rows={3} maxLength={2000} value={newResponder.response} disabled={saving || respondersFull} placeholder="Head to #welcome and run /initiate, {user}!"
              onChange={(event) => setNewResponder({ ...newResponder, response: event.target.value })} className={inputClass} />
          </Field>
          <SaveButton saving={saving} onClick={createResponder} label="Add auto-responder" disabled={respondersFull || newResponder.trigger.trim().length < 2 || !newResponder.response.trim()} />
        </div>
      </Panel>
    </div>
  );
}
