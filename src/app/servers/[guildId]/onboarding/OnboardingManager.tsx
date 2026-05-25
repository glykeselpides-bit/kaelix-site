"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DiscordChannelSelect,
  useDiscordChannels,
} from "@/components/DiscordResourceSelects";

export type OnboardingSettings = {
  onboardingEnabled: boolean;
  activeQuizId: string | null;
  allowRetake: boolean;
  resultVisibility: string;
  showFactionResultPublicly: boolean;
  welcomeChannelId: string | null;
};

export type OnboardingQuiz = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  allowRetake: boolean;
};

export type OnboardingFaction = {
  id: number;
  key: string;
  name: string;
  roleId: string | null;
  hasLinkedRole: boolean;
  isActive: boolean;
  status: string;
};

export type SkippedOnboardingField = {
  field: string;
  reason: string;
};

type OnboardingDraft = {
  onboardingEnabled: boolean;
  activeQuizId: string;
  allowRetake: boolean;
  showFactionResultPublicly: boolean;
  welcomeChannelId: string;
};

const defaultOnboarding: OnboardingDraft = {
  onboardingEnabled: false,
  activeQuizId: "",
  allowRetake: false,
  showFactionResultPublicly: false,
  welcomeChannelId: "",
};

function normalizeOnboarding(
  onboarding: Partial<OnboardingSettings> | null
): OnboardingDraft {
  return {
    onboardingEnabled:
      typeof onboarding?.onboardingEnabled === "boolean"
        ? onboarding.onboardingEnabled
        : defaultOnboarding.onboardingEnabled,
    activeQuizId:
      typeof onboarding?.activeQuizId === "string"
        ? onboarding.activeQuizId
        : defaultOnboarding.activeQuizId,
    allowRetake:
      typeof onboarding?.allowRetake === "boolean"
        ? onboarding.allowRetake
        : defaultOnboarding.allowRetake,
    showFactionResultPublicly:
      typeof onboarding?.showFactionResultPublicly === "boolean"
        ? onboarding.showFactionResultPublicly
        : onboarding?.resultVisibility === "public",
    welcomeChannelId:
      typeof onboarding?.welcomeChannelId === "string"
        ? onboarding.welcomeChannelId
        : defaultOnboarding.welcomeChannelId,
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

function Toggle({
  checked,
  disabled,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <span>
        <span className="block font-semibold text-white">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-400">
          {description}
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

function ComingSoonField({
  label,
  reason,
}: {
  label: string;
  reason: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
          Coming soon
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{reason}</p>
    </div>
  );
}

export default function OnboardingManager({
  guildId,
  initialOnboarding,
  quizzes,
  factions,
  skippedFields,
  loadError,
}: {
  guildId: string;
  initialOnboarding: Partial<OnboardingSettings> | null;
  quizzes: OnboardingQuiz[];
  factions: OnboardingFaction[];
  skippedFields: SkippedOnboardingField[];
  loadError: boolean;
}) {
  const safeInitialOnboarding = useMemo(
    () => normalizeOnboarding(initialOnboarding),
    [initialOnboarding]
  );
  const [onboarding, setOnboarding] =
    useState<OnboardingDraft>(safeInitialOnboarding);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(
    loadError
      ? "Onboarding could not be loaded. Safe defaults are shown."
      : null
  );
  const [success, setSuccess] = useState<string | null>(null);
  const channelsState = useDiscordChannels(guildId);

  const activeFactions = useMemo(
    () => factions.filter((faction) => faction.isActive).length,
    [factions]
  );
  const linkedFactions = useMemo(
    () => factions.filter((faction) => faction.hasLinkedRole).length,
    [factions]
  );
  const skippedByField = useMemo(
    () =>
      Object.fromEntries(
        skippedFields.map((skipped) => [skipped.field, skipped.reason])
      ),
    [skippedFields]
  );

  async function saveOnboarding() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/onboarding`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingEnabled: onboarding.onboardingEnabled,
            activeQuizId: onboarding.activeQuizId.trim() || null,
            allowRetake: onboarding.allowRetake,
            showFactionResultPublicly: onboarding.showFactionResultPublicly,
            welcomeChannelId: onboarding.welcomeChannelId.trim() || null,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to save onboarding configuration.")
        );
      }

      setOnboarding(normalizeOnboarding(data?.onboarding ?? onboarding));
      setSuccess("Onboarding saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save onboarding configuration."
      );
    } finally {
      setIsSaving(false);
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

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">Onboarding</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {onboarding.onboardingEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">Faction roles</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {linkedFactions} / {factions.length}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">Active factions</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {activeFactions} / {factions.length}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Flow
          </p>

          <div className="mt-6 space-y-4">
            <Toggle
              label="Onboarding enabled"
              description="Allow Kaelix onboarding to run for this server."
              checked={onboarding.onboardingEnabled}
              disabled={isSaving}
              onChange={(onboardingEnabled) =>
                setOnboarding((current) => ({
                  ...current,
                  onboardingEnabled,
                }))
              }
            />

            <Toggle
              label="Allow retakes"
              description="Let members retake the active faction quiz."
              checked={onboarding.allowRetake}
              disabled={isSaving}
              onChange={(allowRetake) =>
                setOnboarding((current) => ({ ...current, allowRetake }))
              }
            />

            <Toggle
              label="Show faction result publicly"
              description="Publish faction results instead of keeping them private."
              checked={onboarding.showFactionResultPublicly}
              disabled={isSaving}
              onChange={(showFactionResultPublicly) =>
                setOnboarding((current) => ({
                  ...current,
                  showFactionResultPublicly,
                }))
              }
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Routing
          </p>

          <div className="mt-6 space-y-5">
            <DiscordChannelSelect
              guildId={guildId}
              channelsState={channelsState}
              label="Welcome channel"
              value={onboarding.welcomeChannelId}
              disabled={isSaving}
              onChange={(welcomeChannelId) =>
                setOnboarding((current) => ({
                  ...current,
                  welcomeChannelId,
                }))
              }
            />

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">
                Active faction quiz
              </span>
              <select
                value={onboarding.activeQuizId}
                disabled={isSaving}
                onChange={(event) =>
                  setOnboarding((current) => ({
                    ...current,
                    activeQuizId: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
              >
                <option value="">No active quiz selected</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id.toString()}>
                    {quiz.name}
                    {quiz.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-slate-500">
                Backed by guild_config.active_quiz_id.
              </span>
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
              Factions
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Linked faction roles
            </h2>
          </div>
          <Link
            href={`/servers/${encodeURIComponent(guildId)}/factions`}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            Manage factions
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {factions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-slate-400">
              No factions found for this server yet.
            </div>
          ) : (
            factions.map((faction) => (
              <div
                key={faction.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{faction.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{faction.key}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      faction.isActive
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                        : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                    }`}
                  >
                    {faction.status}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      faction.hasLinkedRole
                        ? "border-blue-400/20 bg-blue-400/10 text-blue-100"
                        : "border-amber-300/20 bg-amber-300/10 text-amber-100"
                    }`}
                  >
                    {faction.hasLinkedRole ? "Role linked" : "No role"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
          Unavailable
        </p>
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <ComingSoonField
            label="Result announcement channel"
            reason={
              skippedByField.resultAnnouncementChannelId ??
              "No dedicated schema field exists yet."
            }
          />
          <ComingSoonField
            label="Auto-assign faction role"
            reason={
              skippedByField.autoAssignFactionRole ??
              "No dedicated schema field exists yet."
            }
          />
          <ComingSoonField
            label="Onboarding title"
            reason={
              skippedByField.onboardingTitle ??
              "No dedicated schema field exists yet."
            }
          />
          <ComingSoonField
            label="Onboarding body"
            reason={
              skippedByField.onboardingBody ??
              "No dedicated schema field exists yet."
            }
          />
          <ComingSoonField
            label="Quiz enabled"
            reason={
              skippedByField.quizEnabled ??
              "No dedicated schema field exists yet."
            }
          />
          <ComingSoonField
            label="Custom factions enabled"
            reason={
              skippedByField.customFactionsEnabled ??
              "No dedicated schema field exists yet."
            }
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={saveOnboarding}
          disabled={isSaving}
          className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {isSaving ? "Saving..." : "Save onboarding"}
        </button>
      </div>
    </div>
  );
}
