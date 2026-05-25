"use client";

import { useEffect, useMemo, useState } from "react";

export type DiscordChannel = {
  id: string;
  name: string;
  type: string;
};

export type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

type ResourceState<T> = {
  items: T[];
  isLoading: boolean;
  error: string | null;
};

type DiscordSelectProps = {
  guildId: string;
  value: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  manualPlaceholder?: string;
  helperText?: string;
  autoSelectFirst?: boolean;
  onChange: (value: string) => void;
};

type DiscordChannelSelectProps = DiscordSelectProps & {
  channelsState?: ResourceState<DiscordChannel>;
};

type DiscordRoleSelectProps = DiscordSelectProps & {
  rolesState?: ResourceState<DiscordRole>;
};

function getErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

function useDiscordResource<T>(
  guildId: string,
  resource: "channels" | "roles",
  fallbackError: string,
  enabled = true
): ResourceState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResource() {
      if (!enabled) {
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/servers/${encodeURIComponent(guildId)}/discord/${resource}`,
          { cache: "no-store" }
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getErrorMessage(data, fallbackError));
        }

        const nextItems = Array.isArray(data?.[resource])
          ? (data[resource] as T[])
          : [];

        if (isMounted) {
          setItems(nextItems);
        }
      } catch (loadError) {
        if (isMounted) {
          setItems([]);
          setError(
            loadError instanceof Error ? loadError.message : fallbackError
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResource();

    return () => {
      isMounted = false;
    };
  }, [enabled, fallbackError, guildId, resource]);

  return { items, isLoading, error };
}

export function useDiscordChannels(guildId: string, enabled = true) {
  return useDiscordResource<DiscordChannel>(
    guildId,
    "channels",
    "Discord channels could not be loaded.",
    enabled
  );
}

export function useDiscordRoles(guildId: string, enabled = true) {
  return useDiscordResource<DiscordRole>(
    guildId,
    "roles",
    "Discord roles could not be loaded.",
    enabled
  );
}

function FieldShell({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  if (!label) {
    return <>{children}</>;
  }

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function ManualInput({
  value,
  disabled,
  placeholder,
  message,
  onChange,
}: {
  value: string;
  disabled: boolean;
  placeholder: string;
  message: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
      />
      <span className="mt-2 block text-xs text-amber-200">{message}</span>
    </>
  );
}

export function DiscordChannelSelect({
  guildId,
  value,
  disabled = false,
  label = "Channel",
  placeholder = "Choose a channel",
  manualPlaceholder = "123456789012345678",
  helperText = "Text, announcement, and forum channels are shown.",
  autoSelectFirst = false,
  channelsState,
  onChange,
}: DiscordChannelSelectProps) {
  const fallbackState = useDiscordChannels(guildId, !channelsState);
  const { items: channels, isLoading, error } = channelsState ?? fallbackState;
  const useManualEntry = Boolean(error) || (!isLoading && channels.length === 0);

  useEffect(() => {
    if (autoSelectFirst && !value && channels[0]?.id) {
      onChange(channels[0].id);
    }
  }, [autoSelectFirst, channels, onChange, value]);

  return (
    <FieldShell label={label}>
      {useManualEntry ? (
        <ManualInput
          value={value}
          disabled={disabled}
          placeholder={manualPlaceholder}
          message={error ?? "No eligible Discord channels were returned."}
          onChange={onChange}
        />
      ) : (
        <>
          <select
            value={value}
            disabled={disabled || isLoading}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
          >
            <option value="">
              {isLoading ? "Loading channels..." : placeholder}
            </option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
            {value && !channels.some((channel) => channel.id === value) ? (
              <option value={value}>{value}</option>
            ) : null}
          </select>
          {helperText ? (
            <span className="mt-2 block text-xs text-slate-500">
              {helperText}
            </span>
          ) : null}
        </>
      )}
    </FieldShell>
  );
}

export function DiscordRoleSelect({
  guildId,
  value,
  disabled = false,
  label = "Discord role",
  placeholder = "Choose a role",
  manualPlaceholder = "123456789012345678",
  helperText = "Managed integration roles and @everyone are hidden.",
  autoSelectFirst = false,
  rolesState,
  onChange,
}: DiscordRoleSelectProps) {
  const fallbackState = useDiscordRoles(guildId, !rolesState);
  const { items: roles, isLoading, error } = rolesState ?? fallbackState;
  const useManualEntry = Boolean(error) || (!isLoading && roles.length === 0);

  useEffect(() => {
    if (autoSelectFirst && !value && roles[0]?.id) {
      onChange(roles[0].id);
    }
  }, [autoSelectFirst, onChange, roles, value]);

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        ...role,
        colorHex:
          role.color > 0 ? `#${role.color.toString(16).padStart(6, "0")}` : "",
      })),
    [roles]
  );

  return (
    <FieldShell label={label}>
      {useManualEntry ? (
        <ManualInput
          value={value}
          disabled={disabled}
          placeholder={manualPlaceholder}
          message={error ?? "No eligible Discord roles were returned."}
          onChange={onChange}
        />
      ) : (
        <>
          <select
            value={value}
            disabled={disabled || isLoading}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
          >
            <option value="">{isLoading ? "Loading roles..." : placeholder}</option>
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id}>
                {role.colorHex ? `${role.name} (${role.colorHex})` : role.name}
              </option>
            ))}
            {value && !roles.some((role) => role.id === value) ? (
              <option value={value}>{value}</option>
            ) : null}
          </select>
          {helperText ? (
            <span className="mt-2 block text-xs text-slate-500">
              {helperText}
            </span>
          ) : null}
        </>
      )}
    </FieldShell>
  );
}
