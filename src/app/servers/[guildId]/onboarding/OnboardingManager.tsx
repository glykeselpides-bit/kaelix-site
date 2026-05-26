"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DiscordChannelSelect,
  useDiscordChannels,
} from "@/components/DiscordResourceSelects";
import {
  ErrorNotice,
  InfoNotice,
  SuccessNotice,
} from "@/components/ServerReadOnlySection";

export type OnboardingSettings = {
  onboardingEnabled: boolean;
  welcomeChannelId: string | null;
  resultChannelId: string | null;
  allowRetakes: boolean;
  showResultPublicly: boolean;
  autoAssignFactionRole: boolean;
  onboardingTitle: string | null;
  onboardingBody: string | null;
  quizEnabled: boolean;
  customFactionsEnabled: boolean;
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

export type OnboardingQuizOption = {
  id: number;
  label: string;
  factionId: number | null;
  weight: number;
  position: number;
  isActive: boolean;
};

export type OnboardingQuizQuestion = {
  id: number;
  question: string;
  position: number;
  isActive: boolean;
  options: OnboardingQuizOption[];
};

type SettingsDraft = {
  onboardingEnabled: boolean;
  welcomeChannelId: string;
  resultChannelId: string;
  allowRetakes: boolean;
  showResultPublicly: boolean;
  autoAssignFactionRole: boolean;
  onboardingTitle: string;
  onboardingBody: string;
  quizEnabled: boolean;
  customFactionsEnabled: boolean;
};

type QuestionDraft = {
  question: string;
  position: number;
  isActive: boolean;
};

type OptionDraft = {
  label: string;
  factionId: string;
  weight: number;
  position: number;
  isActive: boolean;
};

const defaultSettings: SettingsDraft = {
  onboardingEnabled: true,
  welcomeChannelId: "",
  resultChannelId: "",
  allowRetakes: false,
  showResultPublicly: true,
  autoAssignFactionRole: true,
  onboardingTitle: "",
  onboardingBody: "",
  quizEnabled: true,
  customFactionsEnabled: false,
};

function normalizeSettings(
  settings: Partial<OnboardingSettings> | null
): SettingsDraft {
  return {
    onboardingEnabled:
      typeof settings?.onboardingEnabled === "boolean"
        ? settings.onboardingEnabled
        : defaultSettings.onboardingEnabled,
    welcomeChannelId:
      typeof settings?.welcomeChannelId === "string"
        ? settings.welcomeChannelId
        : defaultSettings.welcomeChannelId,
    resultChannelId:
      typeof settings?.resultChannelId === "string"
        ? settings.resultChannelId
        : defaultSettings.resultChannelId,
    allowRetakes:
      typeof settings?.allowRetakes === "boolean"
        ? settings.allowRetakes
        : defaultSettings.allowRetakes,
    showResultPublicly:
      typeof settings?.showResultPublicly === "boolean"
        ? settings.showResultPublicly
        : defaultSettings.showResultPublicly,
    autoAssignFactionRole:
      typeof settings?.autoAssignFactionRole === "boolean"
        ? settings.autoAssignFactionRole
        : defaultSettings.autoAssignFactionRole,
    onboardingTitle:
      typeof settings?.onboardingTitle === "string"
        ? settings.onboardingTitle
        : defaultSettings.onboardingTitle,
    onboardingBody:
      typeof settings?.onboardingBody === "string"
        ? settings.onboardingBody
        : defaultSettings.onboardingBody,
    quizEnabled:
      typeof settings?.quizEnabled === "boolean"
        ? settings.quizEnabled
        : defaultSettings.quizEnabled,
    customFactionsEnabled:
      typeof settings?.customFactionsEnabled === "boolean"
        ? settings.customFactionsEnabled
        : defaultSettings.customFactionsEnabled,
  };
}

function toQuestionDraft(question: OnboardingQuizQuestion): QuestionDraft {
  return {
    question: question.question,
    position: question.position,
    isActive: question.isActive,
  };
}

function toOptionDraft(option: OnboardingQuizOption): OptionDraft {
  return {
    label: option.label,
    factionId: option.factionId?.toString() ?? "",
    weight: option.weight,
    position: option.position,
    isActive: option.isActive,
  };
}

function buildQuestionDrafts(questions: OnboardingQuizQuestion[]) {
  return Object.fromEntries(
    questions.map((question) => [question.id, toQuestionDraft(question)])
  );
}

function buildOptionDrafts(questions: OnboardingQuizQuestion[]) {
  return Object.fromEntries(
    questions.flatMap((question) =>
      question.options.map((option) => [option.id, toOptionDraft(option)])
    )
  );
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

function TextInput({
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

function NumberInput({
  label,
  value,
  disabled,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        type="number"
        min={min}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
      />
    </label>
  );
}

export default function OnboardingManager({
  guildId,
  initialSettings,
  initialQuestions,
  factions,
  loadError,
}: {
  guildId: string;
  initialSettings: Partial<OnboardingSettings> | null;
  initialQuestions: OnboardingQuizQuestion[];
  factions: OnboardingFaction[];
  loadError: boolean;
}) {
  const safeInitialSettings = useMemo(
    () => normalizeSettings(initialSettings),
    [initialSettings]
  );
  const [settings, setSettings] = useState<SettingsDraft>(safeInitialSettings);
  const [questions, setQuestions] = useState(initialQuestions);
  const [questionDrafts, setQuestionDrafts] = useState(() =>
    buildQuestionDrafts(initialQuestions)
  );
  const [optionDrafts, setOptionDrafts] = useState(() =>
    buildOptionDrafts(initialQuestions)
  );
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState<OptionDraft[]>([
    { label: "", factionId: "", weight: 1, position: 0, isActive: true },
    { label: "", factionId: "", weight: 1, position: 1, isActive: true },
  ]);
  const [newOptionByQuestion, setNewOptionByQuestion] = useState<
    Record<number, OptionDraft>
  >({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [loadNotice] = useState<string | null>(
    loadError
      ? "Safe onboarding defaults are shown until saved settings are available."
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const channelsState = useDiscordChannels(guildId);
  const isBusy = busyAction !== null;

  const linkedFactions = useMemo(
    () => factions.filter((faction) => faction.hasLinkedRole).length,
    [factions]
  );

  async function refreshOnboarding() {
    const response = await fetch(
      `/api/servers/${encodeURIComponent(guildId)}/onboarding`,
      { cache: "no-store" }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to refresh onboarding."));
    }

    const nextQuestions = Array.isArray(data?.questions) ? data.questions : [];
    setSettings(normalizeSettings(data?.settings ?? settings));
    setQuestions(nextQuestions);
    setQuestionDrafts(buildQuestionDrafts(nextQuestions));
    setOptionDrafts(buildOptionDrafts(nextQuestions));
  }

  async function saveSettings() {
    setBusyAction("settings");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/onboarding`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingEnabled: settings.onboardingEnabled,
            welcomeChannelId: settings.welcomeChannelId.trim() || null,
            resultChannelId: settings.resultChannelId.trim() || null,
            allowRetakes: settings.allowRetakes,
            showResultPublicly: settings.showResultPublicly,
            autoAssignFactionRole: settings.autoAssignFactionRole,
            onboardingTitle: settings.onboardingTitle.trim() || null,
            onboardingBody: settings.onboardingBody.trim() || null,
            quizEnabled: settings.quizEnabled,
            customFactionsEnabled: settings.customFactionsEnabled,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to save onboarding settings.")
        );
      }

      setSettings(normalizeSettings(data?.settings ?? settings));
      setSuccess("Onboarding settings saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save onboarding settings."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function createQuestion() {
    setBusyAction("create-question");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/onboarding/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: newQuestion.trim(),
            options: newOptions
              .filter((option) => option.label.trim())
              .map((option) => ({
                label: option.label.trim(),
                factionId: option.factionId ? Number(option.factionId) : null,
                weight: option.weight,
                position: option.position,
                isActive: option.isActive,
              })),
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to create question."));
      }

      await refreshOnboarding();
      setNewQuestion("");
      setNewOptions([
        { label: "", factionId: "", weight: 1, position: 0, isActive: true },
        { label: "", factionId: "", weight: 1, position: 1, isActive: true },
      ]);
      setSuccess("Question created.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create question."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function saveQuestion(questionId: number) {
    const draft = questionDrafts[questionId];

    if (!draft) {
      return;
    }

    setBusyAction(`question-${questionId}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/onboarding/quiz`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "question",
            id: questionId,
            question: draft.question.trim(),
            position: draft.position,
            isActive: draft.isActive,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to save question."));
      }

      await refreshOnboarding();
      setSuccess("Question saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save question."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function saveOption(optionId: number) {
    const draft = optionDrafts[optionId];

    if (!draft) {
      return;
    }

    setBusyAction(`option-${optionId}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/onboarding/quiz`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "option",
            id: optionId,
            label: draft.label.trim(),
            factionId: draft.factionId ? Number(draft.factionId) : null,
            weight: draft.weight,
            position: draft.position,
            isActive: draft.isActive,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to save option."));
      }

      await refreshOnboarding();
      setSuccess("Option saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save option."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function createOption(questionId: number) {
    const draft =
      newOptionByQuestion[questionId] ?? {
        label: "",
        factionId: "",
        weight: 1,
        position:
          questions.find((question) => question.id === questionId)?.options
            .length ?? 0,
        isActive: true,
      };

    setBusyAction(`create-option-${questionId}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/onboarding/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "option",
            questionId,
            label: draft.label.trim(),
            factionId: draft.factionId ? Number(draft.factionId) : null,
            weight: draft.weight,
            position: draft.position,
            isActive: draft.isActive,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to add option."));
      }

      await refreshOnboarding();
      setNewOptionByQuestion((current) => ({
        ...current,
        [questionId]: {
          label: "",
          factionId: "",
          weight: 1,
          position: draft.position + 1,
          isActive: true,
        },
      }));
      setSuccess("Option added.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to add option."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function deactivateQuizItem(type: "question" | "option", id: number) {
    setBusyAction(`${type}-delete-${id}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/onboarding/quiz`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, `Failed to deactivate ${type}.`));
      }

      await refreshOnboarding();
      setSuccess(`${type === "question" ? "Question" : "Option"} deactivated.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : `Failed to deactivate ${type}.`
      );
    } finally {
      setBusyAction(null);
    }
  }

  function factionSelect(
    value: string,
    disabled: boolean,
    onChange: (value: string) => void
  ) {
    return (
      <label className="block">
        <span className="text-sm font-semibold text-slate-200">Faction</span>
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
        >
          <option value="">No faction</option>
          {factions.map((faction) => (
            <option key={faction.id} value={faction.id}>
              {faction.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="space-y-6">
      {loadNotice ? <InfoNotice>{loadNotice}</InfoNotice> : null}
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
          Onboarding Settings
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Toggle
            label="Onboarding enabled"
            description="Allow Kaelix onboarding to run for this server."
            checked={settings.onboardingEnabled}
            disabled={isBusy}
            onChange={(onboardingEnabled) =>
              setSettings((current) => ({ ...current, onboardingEnabled }))
            }
          />
          <Toggle
            label="Quiz enabled"
            description="Include the faction quiz in onboarding."
            checked={settings.quizEnabled}
            disabled={isBusy}
            onChange={(quizEnabled) =>
              setSettings((current) => ({ ...current, quizEnabled }))
            }
          />
          <Toggle
            label="Allow retakes"
            description="Let members retake the onboarding quiz."
            checked={settings.allowRetakes}
            disabled={isBusy}
            onChange={(allowRetakes) =>
              setSettings((current) => ({ ...current, allowRetakes }))
            }
          />
          <Toggle
            label="Show result publicly"
            description="Post the final faction result in a server channel."
            checked={settings.showResultPublicly}
            disabled={isBusy}
            onChange={(showResultPublicly) =>
              setSettings((current) => ({ ...current, showResultPublicly }))
            }
          />
          <Toggle
            label="Auto-assign faction role"
            description="Grant the linked faction Discord role after quiz completion."
            checked={settings.autoAssignFactionRole}
            disabled={isBusy}
            onChange={(autoAssignFactionRole) =>
              setSettings((current) => ({
                ...current,
                autoAssignFactionRole,
              }))
            }
          />
          <Toggle
            label="Custom factions"
            description="Allow onboarding flows to use dashboard-managed custom factions."
            checked={settings.customFactionsEnabled}
            disabled={isBusy}
            onChange={(customFactionsEnabled) =>
              setSettings((current) => ({
                ...current,
                customFactionsEnabled,
              }))
            }
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Welcome channel"
            value={settings.welcomeChannelId}
            disabled={isBusy}
            onChange={(welcomeChannelId) =>
              setSettings((current) => ({ ...current, welcomeChannelId }))
            }
          />
          <DiscordChannelSelect
            guildId={guildId}
            channelsState={channelsState}
            label="Result channel"
            value={settings.resultChannelId}
            disabled={isBusy}
            onChange={(resultChannelId) =>
              setSettings((current) => ({ ...current, resultChannelId }))
            }
          />
          <TextInput
            label="Onboarding title"
            value={settings.onboardingTitle}
            disabled={isBusy}
            maxLength={200}
            placeholder="Welcome to Kaelix"
            onChange={(onboardingTitle) =>
              setSettings((current) => ({ ...current, onboardingTitle }))
            }
          />
          <label className="block lg:col-span-2">
            <span className="text-sm font-semibold text-slate-200">
              Onboarding body
            </span>
            <textarea
              value={settings.onboardingBody}
              disabled={isBusy}
              placeholder="Set the message members see before starting."
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  onboardingBody: event.target.value,
                }))
              }
              className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={isBusy}
          className="mt-6 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {busyAction === "settings" ? "Saving..." : "Save settings"}
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
              Faction Quiz
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Questions and options
            </h2>
          </div>
          <span className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
            {questions.filter((question) => question.isActive).length} active
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
          <TextInput
            label="New question"
            value={newQuestion}
            disabled={isBusy}
            placeholder="What kind of collaboration energizes you?"
            onChange={setNewQuestion}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {newOptions.map((option, index) => (
              <div key={index} className="rounded-2xl border border-white/10 p-4">
                <TextInput
                  label={`Option ${index + 1}`}
                  value={option.label}
                  disabled={isBusy}
                  placeholder="Building quietly behind the scenes"
                  onChange={(label) =>
                    setNewOptions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label } : item
                      )
                    )
                  }
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {factionSelect(option.factionId, isBusy, (factionId) =>
                    setNewOptions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, factionId } : item
                      )
                    )
                  )}
                  <NumberInput
                    label="Weight"
                    value={option.weight}
                    disabled={isBusy}
                    min={1}
                    onChange={(weight) =>
                      setNewOptions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, weight } : item
                        )
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={createQuestion}
            disabled={isBusy || !newQuestion.trim()}
            className="mt-5 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {busyAction === "create-question" ? "Creating..." : "Create question"}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {questions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-slate-400">
              No quiz questions yet.
            </div>
          ) : (
            questions.map((question) => {
              const draft = questionDrafts[question.id] ?? toQuestionDraft(question);
              const newOption =
                newOptionByQuestion[question.id] ?? {
                  label: "",
                  factionId: "",
                  weight: 1,
                  position: question.options.length,
                  isActive: true,
                };

              return (
                <article
                  key={question.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_120px_auto] lg:items-end">
                    <TextInput
                      label="Question"
                      value={draft.question}
                      disabled={isBusy}
                      onChange={(nextQuestion) =>
                        setQuestionDrafts((current) => ({
                          ...current,
                          [question.id]: { ...draft, question: nextQuestion },
                        }))
                      }
                    />
                    <NumberInput
                      label="Position"
                      value={draft.position}
                      disabled={isBusy}
                      onChange={(position) =>
                        setQuestionDrafts((current) => ({
                          ...current,
                          [question.id]: { ...draft, position },
                        }))
                      }
                    />
                    <Toggle
                      label="Active"
                      description="Shown in quiz"
                      checked={draft.isActive}
                      disabled={isBusy}
                      onChange={(isActive) =>
                        setQuestionDrafts((current) => ({
                          ...current,
                          [question.id]: { ...draft, isActive },
                        }))
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => saveQuestion(question.id)}
                      disabled={isBusy}
                      className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                    >
                      {busyAction === `question-${question.id}`
                        ? "Saving..."
                        : "Save question"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deactivateQuizItem("question", question.id)}
                      disabled={isBusy || !question.isActive}
                      className="rounded-2xl border border-red-400/20 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Deactivate question
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    {question.options.map((option) => {
                      const optionDraft =
                        optionDrafts[option.id] ?? toOptionDraft(option);

                      return (
                        <div
                          key={option.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="grid gap-4 lg:grid-cols-[1fr_180px_110px_110px]">
                            <TextInput
                              label="Option"
                              value={optionDraft.label}
                              disabled={isBusy}
                              onChange={(label) =>
                                setOptionDrafts((current) => ({
                                  ...current,
                                  [option.id]: { ...optionDraft, label },
                                }))
                              }
                            />
                            {factionSelect(
                              optionDraft.factionId,
                              isBusy,
                              (factionId) =>
                                setOptionDrafts((current) => ({
                                  ...current,
                                  [option.id]: { ...optionDraft, factionId },
                                }))
                            )}
                            <NumberInput
                              label="Weight"
                              value={optionDraft.weight}
                              disabled={isBusy}
                              min={1}
                              onChange={(weight) =>
                                setOptionDrafts((current) => ({
                                  ...current,
                                  [option.id]: { ...optionDraft, weight },
                                }))
                              }
                            />
                            <NumberInput
                              label="Position"
                              value={optionDraft.position}
                              disabled={isBusy}
                              onChange={(position) =>
                                setOptionDrafts((current) => ({
                                  ...current,
                                  [option.id]: { ...optionDraft, position },
                                }))
                              }
                            />
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Toggle
                              label="Active"
                              description="Counts in scoring"
                              checked={optionDraft.isActive}
                              disabled={isBusy}
                              onChange={(isActive) =>
                                setOptionDrafts((current) => ({
                                  ...current,
                                  [option.id]: { ...optionDraft, isActive },
                                }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() => saveOption(option.id)}
                              disabled={isBusy}
                              className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                            >
                              {busyAction === `option-${option.id}`
                                ? "Saving..."
                                : "Save option"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deactivateQuizItem("option", option.id)
                              }
                              disabled={isBusy || !option.isActive}
                              className="rounded-2xl border border-red-400/20 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Deactivate option
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_180px_110px_auto] lg:items-end">
                      <TextInput
                        label="Add option"
                        value={newOption.label}
                        disabled={isBusy}
                        placeholder="I like to lead the charge"
                        onChange={(label) =>
                          setNewOptionByQuestion((current) => ({
                            ...current,
                            [question.id]: { ...newOption, label },
                          }))
                        }
                      />
                      {factionSelect(newOption.factionId, isBusy, (factionId) =>
                        setNewOptionByQuestion((current) => ({
                          ...current,
                          [question.id]: { ...newOption, factionId },
                        }))
                      )}
                      <NumberInput
                        label="Weight"
                        value={newOption.weight}
                        disabled={isBusy}
                        min={1}
                        onChange={(weight) =>
                          setNewOptionByQuestion((current) => ({
                            ...current,
                            [question.id]: { ...newOption, weight },
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => createOption(question.id)}
                        disabled={isBusy || !newOption.label.trim()}
                        className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                      >
                        {busyAction === `create-option-${question.id}`
                          ? "Adding..."
                          : "Add option"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
              Linked Factions
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              {linkedFactions} of {factions.length} have Discord roles
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
              No active factions found for this server yet.
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
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100">
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
    </div>
  );
}
