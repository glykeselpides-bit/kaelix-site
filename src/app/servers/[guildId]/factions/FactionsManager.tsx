"use client";

import { useMemo, useState } from "react";
import {
  DiscordRoleSelect,
  type DiscordRole,
  useDiscordRoles,
} from "@/components/DiscordResourceSelects";

export type FactionItem = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  roleId: string | null;
  isActive: boolean;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type FactionDraft = {
  name: string;
  key: string;
  description: string;
  emoji: string;
  color: string;
  roleId: string;
  isActive: boolean;
};

const emptyDraft: FactionDraft = {
  name: "",
  key: "",
  description: "",
  emoji: "",
  color: "",
  roleId: "",
  isActive: true,
};

function toDraft(faction: FactionItem): FactionDraft {
  return {
    name: faction.name,
    key: faction.key,
    description: faction.description ?? "",
    emoji: faction.emoji ?? "",
    color: faction.color ?? "",
    roleId: faction.roleId ?? "",
    isActive: faction.isActive,
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

function normalizeDraft(draft: FactionDraft) {
  return {
    name: draft.name.trim(),
    key: draft.key.trim(),
    description: draft.description.trim() || null,
    emoji: draft.emoji.trim() || null,
    color: draft.color.trim() || null,
    roleId: draft.roleId.trim() || null,
    isActive: draft.isActive,
  };
}

function getRoleLabel(roles: DiscordRole[], roleId: string | null) {
  if (!roleId) {
    return "No linked role";
  }

  const role = roles.find((item) => item.id === roleId);
  return role ? `@${role.name}` : roleId;
}

function TextField({
  label,
  value,
  disabled,
  placeholder,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
      />
    </label>
  );
}

function RoleLinkPanel({
  guildId,
  rolesState,
  value,
  disabled,
  suggestedName,
  suggestedColor,
  isCreatingRole,
  onChange,
  onCreateRole,
}: {
  guildId: string;
  rolesState: ReturnType<typeof useDiscordRoles>;
  value: string;
  disabled: boolean;
  suggestedName: string;
  suggestedColor: string;
  isCreatingRole: boolean;
  onChange: (roleId: string) => void;
  onCreateRole: (name: string, color: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"existing" | "create">("existing");
  const [roleName, setRoleName] = useState("");
  const [roleColor, setRoleColor] = useState(suggestedColor);
  const roleNameValue = roleName.trim() || suggestedName.trim();
  const roleColorValue = roleColor.trim() || suggestedColor.trim();

  return (
    <div className="space-y-3 lg:col-span-2">
      <div>
        <span className="text-sm font-semibold text-slate-200">
          Linked Discord role
        </span>
        <span className="mt-1 block text-xs text-slate-500">
          Kaelix can create a Discord role for this faction if one does not
          exist yet.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("existing")}
          disabled={disabled}
          className={`rounded-2xl border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            mode === "existing"
              ? "border-blue-400/40 bg-blue-500/15 text-blue-100"
              : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          Link existing role
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          disabled={disabled}
          className={`rounded-2xl border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            mode === "create"
              ? "border-blue-400/40 bg-blue-500/15 text-blue-100"
              : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          Create new role
        </button>
      </div>

      {mode === "existing" ? (
        <DiscordRoleSelect
          guildId={guildId}
          rolesState={rolesState}
          label=""
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-slate-200">
              Role name
            </span>
            <input
              type="text"
              value={roleName}
              disabled={disabled || isCreatingRole}
              maxLength={100}
              placeholder={suggestedName || "Faction role"}
              onChange={(event) => setRoleName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-200">
              Role color
            </span>
            <input
              type="text"
              value={roleColor}
              disabled={disabled || isCreatingRole}
              maxLength={7}
              placeholder={suggestedColor || "#60a5fa"}
              onChange={(event) => setRoleColor(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
            />
          </label>

          <button
            type="button"
            onClick={() => onCreateRole(roleNameValue, roleColorValue)}
            disabled={disabled || isCreatingRole || !roleNameValue}
            className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {isCreatingRole ? "Creating..." : "Create role"}
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-slate-200">
          Active
        </span>
        <span className="mt-1 block text-xs text-slate-500">
          Inactive factions stay stored but hidden from active flows.
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

export default function FactionsManager({
  guildId,
  initialFactions,
  loadError,
}: {
  guildId: string;
  initialFactions: FactionItem[];
  loadError: boolean;
}) {
  const [factions, setFactions] = useState(initialFactions);
  const rolesState = useDiscordRoles(guildId);
  const { items: roles } = rolesState;
  const [createDraft, setCreateDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<Record<number, FactionDraft>>(() =>
    Object.fromEntries(
      initialFactions.map((faction) => [faction.id, toDraft(faction)])
    )
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    loadError ? "Factions could not be loaded." : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const activeCount = useMemo(
    () => factions.filter((faction) => faction.isActive).length,
    [factions]
  );

  const isBusy = busyAction !== null;

  async function createDiscordRole(name: string, color: string) {
    const response = await fetch(
      `/api/servers/${encodeURIComponent(guildId)}/discord/roles/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          color: color.trim() || undefined,
        }),
      }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to create Discord role."));
    }

    if (!data?.role?.id || typeof data.role.id !== "string") {
      throw new Error("Discord did not return a created role ID.");
    }

    rolesState.refresh();

    return data.role as DiscordRole;
  }

  async function createRoleForDraft(
    draft: FactionDraft,
    onRoleId: (roleId: string) => void
  ) {
    setBusyAction("create-role");
    setError(null);
    setSuccess(null);

    try {
      const role = await createDiscordRole(draft.name.trim(), draft.color);
      onRoleId(role.id);
      setSuccess("Discord role created and selected.");
    } catch (roleError) {
      setError(
        roleError instanceof Error
          ? roleError.message
          : "Failed to create Discord role."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function createRoleForFaction(factionId: number, draft: FactionDraft) {
    setBusyAction(`create-role-${factionId}`);
    setError(null);
    setSuccess(null);

    try {
      const role = await createDiscordRole(draft.name.trim(), draft.color);
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/factions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: factionId,
            roleId: role.id,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Discord role was created, but linking failed.")
        );
      }

      await refreshFactions();
      setSuccess("Discord role created and linked.");
    } catch (roleError) {
      setError(
        roleError instanceof Error
          ? roleError.message
          : "Failed to create and link Discord role."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function refreshFactions() {
    const response = await fetch(
      `/api/servers/${encodeURIComponent(guildId)}/factions`,
      { cache: "no-store" }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to refresh factions."));
    }

    const nextFactions = Array.isArray(data?.factions) ? data.factions : [];
    setFactions(nextFactions);
    setEditing(
      Object.fromEntries(
        nextFactions.map((faction: FactionItem) => [
          faction.id,
          toDraft(faction),
        ])
      )
    );
  }

  async function createFaction() {
    setBusyAction("create");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/factions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizeDraft(createDraft)),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to create faction."));
      }

      await refreshFactions();
      setCreateDraft(emptyDraft);
      setSuccess("Faction created.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create faction."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function saveFaction(factionId: number) {
    const draft = editing[factionId];

    if (!draft) {
      return;
    }

    setBusyAction(`save-${factionId}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/factions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: factionId,
            name: draft.name.trim(),
            description: draft.description.trim() || null,
            emoji: draft.emoji.trim() || null,
            color: draft.color.trim() || null,
            roleId: draft.roleId.trim() || null,
            isActive: draft.isActive,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to save faction."));
      }

      await refreshFactions();
      setSuccess("Faction saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save faction."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function deactivateFaction(factionId: number) {
    setBusyAction(`delete-${factionId}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/factions`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: factionId }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to deactivate faction.")
        );
      }

      await refreshFactions();
      setSuccess("Faction deactivated.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to deactivate faction."
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
            <h2 className="mt-3 text-2xl font-bold text-white">
              New faction
            </h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
            {activeCount} active / {factions.length} total
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <TextField
            label="Name"
            value={createDraft.name}
            disabled={isBusy}
            maxLength={100}
            placeholder="Aurora"
            onChange={(name) =>
              setCreateDraft((current) => ({ ...current, name }))
            }
          />

          <TextField
            label="Key"
            value={createDraft.key}
            disabled={isBusy}
            maxLength={50}
            placeholder="aurora"
            onChange={(key) =>
              setCreateDraft((current) => ({ ...current, key }))
            }
          />

          <TextField
            label="Emoji"
            value={createDraft.emoji}
            disabled={isBusy}
            maxLength={50}
            placeholder=":sparkles:"
            onChange={(emoji) =>
              setCreateDraft((current) => ({ ...current, emoji }))
            }
          />

          <TextField
            label="Color"
            value={createDraft.color}
            disabled={isBusy}
            maxLength={20}
            placeholder="#60a5fa"
            onChange={(color) =>
              setCreateDraft((current) => ({ ...current, color }))
            }
          />

          <RoleLinkPanel
            guildId={guildId}
            rolesState={rolesState}
            value={createDraft.roleId}
            disabled={isBusy}
            suggestedName={createDraft.name}
            suggestedColor={createDraft.color}
            isCreatingRole={busyAction === "create-role"}
            onChange={(roleId) =>
              setCreateDraft((current) => ({ ...current, roleId }))
            }
            onCreateRole={(name, color) =>
              createRoleForDraft(
                { ...createDraft, name, color },
                (roleId) =>
                  setCreateDraft((current) => ({ ...current, roleId }))
              )
            }
          />

          <label className="block lg:col-span-2">
            <span className="text-sm font-semibold text-slate-200">
              Description
            </span>
            <textarea
              value={createDraft.description}
              disabled={isBusy}
              maxLength={500}
              placeholder="Faction identity, values, or onboarding notes."
              onChange={(event) =>
                setCreateDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={createFaction}
          disabled={isBusy}
          className="mt-6 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {busyAction === "create" ? "Creating..." : "Create faction"}
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

        {factions.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
            No factions found for this server yet.
          </div>
        ) : (
          factions.map((faction) => {
            const draft = editing[faction.id] ?? toDraft(faction);
            const accent = draft.color || faction.color || "#60a5fa";

            return (
              <article
                key={faction.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xl"
                      style={{ boxShadow: `inset 0 0 0 2px ${accent}` }}
                    >
                      {draft.emoji || faction.emoji || "#"}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {faction.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {faction.key} / {faction.status}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {getRoleLabel(roles, faction.roleId)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      faction.isActive
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                        : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                    }`}
                  >
                    {faction.status}
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
                        [faction.id]: { ...draft, name },
                      }))
                    }
                  />

                  <TextField
                    label="Emoji"
                    value={draft.emoji}
                    disabled={isBusy}
                    maxLength={50}
                    onChange={(emoji) =>
                      setEditing((current) => ({
                        ...current,
                        [faction.id]: { ...draft, emoji },
                      }))
                    }
                  />

                  <TextField
                    label="Color"
                    value={draft.color}
                    disabled={isBusy}
                    maxLength={20}
                    onChange={(color) =>
                      setEditing((current) => ({
                        ...current,
                        [faction.id]: { ...draft, color },
                      }))
                    }
                  />

                  <RoleLinkPanel
                    guildId={guildId}
                    rolesState={rolesState}
                    value={draft.roleId}
                    disabled={isBusy}
                    suggestedName={draft.name}
                    suggestedColor={draft.color}
                    isCreatingRole={busyAction === `create-role-${faction.id}`}
                    onChange={(roleId) =>
                      setEditing((current) => ({
                        ...current,
                        [faction.id]: { ...draft, roleId },
                      }))
                    }
                    onCreateRole={(name, color) =>
                      createRoleForFaction(faction.id, {
                        ...draft,
                        name,
                        color,
                      })
                    }
                  />

                  <Toggle
                    checked={draft.isActive}
                    disabled={isBusy}
                    onChange={(isActive) =>
                      setEditing((current) => ({
                        ...current,
                        [faction.id]: { ...draft, isActive },
                      }))
                    }
                  />

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-semibold text-slate-200">
                      Description
                    </span>
                    <textarea
                      value={draft.description}
                      disabled={isBusy}
                      maxLength={500}
                      onChange={(event) =>
                        setEditing((current) => ({
                          ...current,
                          [faction.id]: {
                            ...draft,
                            description: event.target.value,
                          },
                        }))
                      }
                      className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveFaction(faction.id)}
                    disabled={isBusy}
                    className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                  >
                    {busyAction === `save-${faction.id}`
                      ? "Saving..."
                      : "Save changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditing((current) => ({
                        ...current,
                        [faction.id]: toDraft(faction),
                      }))
                    }
                    disabled={isBusy}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={() => deactivateFaction(faction.id)}
                    disabled={isBusy || !faction.isActive}
                    className="rounded-2xl border border-red-400/20 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction === `delete-${faction.id}`
                      ? "Deactivating..."
                      : "Deactivate"}
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
