"use client";

import { useMemo, useState } from "react";

export type TriviaQuestion = {
  id: number;
  guildId: string | null;
  scope: "guild" | "global";
  category: string;
  questionType: string;
  question: string;
  answer: string;
  difficulty: string | null;
  rewardPoints: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type TriviaPayload = {
  questions: TriviaQuestion[];
  total: number;
  warnings?: string[];
};

type TriviaDraft = {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  rewardPoints: string;
};

const emptyDraft: TriviaDraft = {
  question: "",
  answer: "",
  category: "General",
  difficulty: "",
  rewardPoints: "",
};

const difficultyOptions = [
  { value: "", label: "Any difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function toDraft(question: TriviaQuestion): TriviaDraft {
  return {
    question: question.question,
    answer: question.answer,
    category: question.category,
    difficulty: question.difficulty ?? "",
    rewardPoints:
      question.rewardPoints === null || question.rewardPoints === undefined
        ? ""
        : String(question.rewardPoints),
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

function normalizePayload(data: unknown): TriviaPayload {
  if (!data || typeof data !== "object") {
    return { questions: [], total: 0 };
  }

  const payload = data as Partial<TriviaPayload>;

  return {
    questions: Array.isArray(payload.questions) ? payload.questions : [],
    total:
      typeof payload.total === "number" && Number.isFinite(payload.total)
        ? payload.total
        : 0,
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
  };
}

function parseRewardPoints(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: true as const, value: null };
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return {
      ok: false as const,
      error: "Reward points must be empty or a non-negative whole number.",
    };
  }

  return { ok: true as const, value: parsed };
}

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  placeholder,
  disabled,
  maxLength,
  onChange,
}: {
  value: string;
  placeholder?: string;
  disabled: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-60"
    />
  );
}

function SelectInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
    >
      {difficultyOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function QuestionFields({
  draft,
  disabled,
  onChange,
}: {
  draft: TriviaDraft;
  disabled: boolean;
  onChange: (draft: TriviaDraft) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FieldShell label="Question">
        <TextInput
          value={draft.question}
          disabled={disabled}
          maxLength={500}
          placeholder="What is Kaelix?"
          onChange={(question) => onChange({ ...draft, question })}
        />
      </FieldShell>

      <FieldShell label="Answer">
        <TextInput
          value={draft.answer}
          disabled={disabled}
          maxLength={200}
          placeholder="A Discord community bot"
          onChange={(answer) => onChange({ ...draft, answer })}
        />
      </FieldShell>

      <FieldShell label="Category">
        <TextInput
          value={draft.category}
          disabled={disabled}
          maxLength={100}
          placeholder="General"
          onChange={(category) => onChange({ ...draft, category })}
        />
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Difficulty">
          <SelectInput
            value={draft.difficulty}
            disabled={disabled}
            onChange={(difficulty) => onChange({ ...draft, difficulty })}
          />
        </FieldShell>

        <FieldShell label="Reward points">
          <TextInput
            value={draft.rewardPoints}
            disabled={disabled}
            placeholder="Use activity default"
            onChange={(rewardPoints) => onChange({ ...draft, rewardPoints })}
          />
        </FieldShell>
      </div>
    </div>
  );
}

function toPayload(draft: TriviaDraft) {
  const rewardPoints = parseRewardPoints(draft.rewardPoints);

  if (!rewardPoints.ok) {
    return rewardPoints;
  }

  return {
    ok: true as const,
    value: {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      category: draft.category.trim() || "General",
      difficulty: draft.difficulty || null,
      rewardPoints: rewardPoints.value,
    },
  };
}

export default function TriviaQuestionsManager({
  guildId,
  initialPayload,
}: {
  guildId: string;
  initialPayload: TriviaPayload;
}) {
  const normalizedInitial = normalizePayload(initialPayload);
  const [questions, setQuestions] = useState(normalizedInitial.questions);
  const [total, setTotal] = useState(normalizedInitial.total);
  const [createDraft, setCreateDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<Record<number, TriviaDraft>>(() =>
    Object.fromEntries(
      normalizedInitial.questions.map((question) => [
        question.id,
        toDraft(question),
      ])
    )
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    normalizedInitial.warnings?.[0] ?? null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const isBusy = busyAction !== null;
  const categories = useMemo(
    () =>
      Array.from(
        new Set(questions.map((question) => question.category).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [questions]
  );
  const filteredQuestions = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesSearch =
        !needle ||
        question.question.toLowerCase().includes(needle) ||
        question.answer.toLowerCase().includes(needle) ||
        question.category.toLowerCase().includes(needle);
      const matchesCategory =
        !categoryFilter || question.category === categoryFilter;
      const matchesDifficulty =
        !difficultyFilter || question.difficulty === difficultyFilter;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [categoryFilter, difficultyFilter, questions, search]);

  async function refreshQuestions() {
    const response = await fetch(
      `/api/servers/${encodeURIComponent(
        guildId
      )}/activities/trivia?includeInactive=true`,
      { cache: "no-store" }
    );
    const data = normalizePayload(await response.json().catch(() => null));

    if (!response.ok) {
      throw new Error(
        getErrorMessage(data, "Failed to refresh trivia questions.")
      );
    }

    setQuestions(data.questions);
    setTotal(data.total);
    setEditing(
      Object.fromEntries(
        data.questions.map((question) => [question.id, toDraft(question)])
      )
    );
  }

  async function createQuestion() {
    const payload = toPayload(createDraft);

    if (!payload.ok) {
      setError(payload.error);
      setSuccess(null);
      return;
    }

    setBusyAction("create");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/activities/trivia`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload.value),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to create trivia question.")
        );
      }

      await refreshQuestions();
      setCreateDraft(emptyDraft);
      setSuccess("Trivia question created.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create trivia question."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function saveQuestion(question: TriviaQuestion) {
    const draft = editing[question.id] ?? toDraft(question);
    const payload = toPayload(draft);

    if (!payload.ok) {
      setError(payload.error);
      setSuccess(null);
      return;
    }

    setBusyAction(`save-${question.id}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/activities/trivia`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: question.id, ...payload.value }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to save trivia question.")
        );
      }

      await refreshQuestions();
      setEditingId(null);
      setSuccess("Trivia question saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save trivia question."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function deactivateQuestion(question: TriviaQuestion) {
    setBusyAction(`delete-${question.id}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(guildId)}/activities/trivia`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: question.id }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to deactivate trivia question.")
        );
      }

      await refreshQuestions();
      setSuccess("Trivia question deactivated.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to deactivate trivia question."
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Content
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Trivia Questions
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Manage guild-specific trivia questions. Global defaults remain
            visible for fallback but cannot be edited from this server.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          {filteredQuestions.length} shown / {total} total
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-white/10 pb-5">
        {["Trivia Questions", "Riddles", "Prompts", "Word lists"].map(
          (item, index) => (
            <button
              key={item}
              type="button"
              disabled={index > 0}
              className={`rounded-2xl border px-4 py-2 text-sm font-bold ${
                index === 0
                  ? "border-blue-300/40 bg-blue-400/10 text-blue-100"
                  : "cursor-not-allowed border-white/10 bg-black/20 text-slate-500"
              }`}
            >
              {index === 0 ? item : `${item} soon`}
            </button>
          )
        )}
      </div>

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

      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">New question</h3>
          <button
            type="button"
            onClick={createQuestion}
            disabled={isBusy}
            className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {busyAction === "create" ? "Creating..." : "Create"}
          </button>
        </div>
        <div className="mt-5">
          <QuestionFields
            draft={createDraft}
            disabled={isBusy}
            onChange={setCreateDraft}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TextInput
          value={search}
          disabled={isBusy}
          placeholder="Search questions, answers, categories"
          onChange={setSearch}
        />
        <select
          value={categoryFilter}
          disabled={isBusy}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-blue-400 disabled:opacity-60"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <SelectInput
          value={difficultyFilter}
          disabled={isBusy}
          onChange={setDifficultyFilter}
        />
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-slate-300">
          No trivia questions match this view.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => {
            const isGuildQuestion = question.scope === "guild";
            const isEditing = editingId === question.id;
            const draft = editing[question.id] ?? toDraft(question);

            return (
              <article
                key={question.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isGuildQuestion
                            ? "bg-blue-400/10 text-blue-100"
                            : "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {isGuildQuestion ? "Server" : "Global"}
                      </span>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                        {question.category}
                      </span>
                      {question.difficulty ? (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                          {question.difficulty}
                        </span>
                      ) : null}
                      {!question.isActive ? (
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-100">
                          Inactive
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-base font-bold text-white">
                      {question.question}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Answer: {question.answer}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Reward:{" "}
                      {question.rewardPoints === null
                        ? "activity default"
                        : `${question.rewardPoints} pts`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingId((current) =>
                          current === question.id ? null : question.id
                        )
                      }
                      disabled={isBusy || !isGuildQuestion}
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isEditing ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deactivateQuestion(question)}
                      disabled={isBusy || !isGuildQuestion || !question.isActive}
                      className="rounded-2xl border border-red-400/20 px-4 py-2 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyAction === `delete-${question.id}`
                        ? "Deactivating..."
                        : "Deactivate"}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <QuestionFields
                      draft={draft}
                      disabled={isBusy}
                      onChange={(nextDraft) =>
                        setEditing((current) => ({
                          ...current,
                          [question.id]: nextDraft,
                        }))
                      }
                    />
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => saveQuestion(question)}
                        disabled={isBusy}
                        className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                      >
                        {busyAction === `save-${question.id}`
                          ? "Saving..."
                          : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((current) => ({
                            ...current,
                            [question.id]: toDraft(question),
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-60"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
