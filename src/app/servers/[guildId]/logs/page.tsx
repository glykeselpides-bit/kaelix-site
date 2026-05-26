import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  EmptyValue,
  InfoNotice,
  LoadError,
  formatDashboardDate,
} from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LogItem = {
  id: number;
  actionType: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  userId: string | null;
  metadata: unknown;
  createdAt: string | null;
};

type LogsData = {
  logs: LogItem[];
  warning?: string;
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  UPDATE: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  DELETE: "border-red-400/30 bg-red-400/10 text-red-200",
  ENABLE: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  DISABLE: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  END_SESSION: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  event_registered: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  guild_config_updated: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  points_awarded: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  ENABLE: "Enabled",
  DISABLE: "Disabled",
  END_SESSION: "Ended session",
  event_registered: "Event registered",
  guild_config_updated: "Settings updated",
  points_awarded: "Points awarded",
};

const ENTITY_LABELS: Record<string, string> = {
  ACTIVITY: "Activity",
  EVENT: "Event",
  FACTION: "Faction",
  ONBOARDING: "Onboarding",
  SETTINGS: "Settings",
  TRIVIA_QUESTION: "Trivia question",
  GUILD_CONFIG: "Settings",
  event: "Event",
  guild_config: "Settings",
  "guild config": "Settings",
};

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold ${
        ACTION_STYLES[action] ??
        "border-white/15 bg-white/5 text-slate-200"
      }`}
    >
      {formatActionLabel(action)}
    </span>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonSummary(summary: string) {
  try {
    const parsed: unknown = JSON.parse(summary);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function humanizeToken(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\bid\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatActionLabel(action: string) {
  return ACTION_LABELS[action] ?? humanizeToken(action);
}

function formatEntityLabel(entity: string) {
  return ENTITY_LABELS[entity] ?? humanizeToken(entity);
}

function getStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getNumberField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
}

function getChangedField(record: Record<string, unknown>) {
  const direct = getStringField(record, [
    "field",
    "changedField",
    "changed_field",
  ]);

  if (direct) {
    return humanizeToken(direct);
  }

  const fields = record.fields;

  if (Array.isArray(fields) && typeof fields[0] === "string") {
    return humanizeToken(fields[0]);
  }

  return null;
}

function formatStructuredSummary(log: LogItem, details: Record<string, unknown>) {
  const action =
    getStringField(details, ["action", "actionType", "action_type"]) ??
    log.actionType;
  const eventName =
    getStringField(details, [
      "eventName",
      "event_name",
      "event",
      "name",
      "label",
      "title",
    ]) ??
    log.entityId ??
    "event";

  if (action === "event_registered") {
    return `Registered for ${eventName}`;
  }

  if (action === "guild_config_updated") {
    const field = getChangedField(details);
    return field ? `Updated ${field.toLowerCase()}` : "Updated settings";
  }

  if (action === "points_awarded") {
    const points = getNumberField(details, ["points", "amount", "delta"]);
    const reason =
      getStringField(details, [
        "reason",
        "eventName",
        "event_name",
        "event",
        "source",
      ]) ??
      eventName;

    if (points !== null) {
      return `Awarded ${points} points for ${reason}`;
    }

    return `Awarded points for ${reason}`;
  }

  return null;
}

function formatSummary(log: LogItem) {
  const parsedSummary =
    typeof log.summary === "string" ? parseJsonSummary(log.summary) : null;
  const metadata = isRecord(log.metadata) ? log.metadata : null;
  const structuredSummary =
    (parsedSummary ? formatStructuredSummary(log, parsedSummary) : null) ??
    (metadata ? formatStructuredSummary(log, metadata) : null);

  if (structuredSummary) {
    return structuredSummary;
  }

  if (log.summary && !parsedSummary) {
    return log.summary;
  }

  return `${formatActionLabel(log.actionType)} ${formatEntityLabel(log.entityType).toLowerCase()}`;
}

function EntityLabel({ log }: { log: LogItem }) {
  return (
    <div>
      <div className="font-medium text-slate-200">
        {formatEntityLabel(log.entityType)}
      </div>
      {log.entityId ? (
        <div className="mt-1 text-xs text-slate-500">{log.entityId}</div>
      ) : null}
    </div>
  );
}

function MetadataDetails({ metadata }: { metadata: unknown }) {
  if (!metadata) {
    return null;
  }

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04]">
        View details
      </summary>
      <pre className="mt-3 max-h-56 overflow-auto rounded-2xl border border-white/10 bg-black/50 p-4 text-xs leading-5 text-slate-300">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </details>
  );
}

function LogsList({ logs }: { logs: LogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
        No dashboard actions recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article
          key={log.id}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <ActionBadge action={log.actionType} />
                <EntityLabel log={log} />
              </div>
              <p className="text-base leading-7 text-white">
                {formatSummary(log)}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>{formatDashboardDate(log.createdAt)}</span>
                <span>Actor: {log.userId ?? <EmptyValue />}</span>
              </div>
            </div>
            <MetadataDetails metadata={log.metadata} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function LogsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = await fetchServerSection<LogsData>(guildId, "logs");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Logs"
      description="Review dashboard actions that changed this server."
    >
      {data ? (
        <div className="space-y-5">
          {data.warning ? <InfoNotice>{data.warning}</InfoNotice> : null}
          <LogsList logs={data.logs} />
        </div>
      ) : (
        <LoadError label="server logs" />
      )}
    </ServerSectionPlaceholder>
  );
}
