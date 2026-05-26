import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  DataTable,
  EmptyValue,
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
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  UPDATE: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  DELETE: "border-red-400/30 bg-red-400/10 text-red-200",
  ENABLE: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  DISABLE: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  END_SESSION: "border-violet-400/30 bg-violet-400/10 text-violet-200",
};

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold ${
        ACTION_STYLES[action] ??
        "border-white/15 bg-white/5 text-slate-200"
      }`}
    >
      {action.replace("_", " ")}
    </span>
  );
}

function EntityLabel({ log }: { log: LogItem }) {
  return (
    <div>
      <div className="font-medium text-slate-200">
        {log.entityType.replace("_", " ")}
      </div>
      {log.entityId ? (
        <div className="mt-1 text-xs text-slate-500">{log.entityId}</div>
      ) : null}
    </div>
  );
}

function MetadataDetails({ metadata }: { metadata: unknown }) {
  if (!metadata) {
    return <EmptyValue />;
  }

  return (
    <details className="max-w-sm">
      <summary className="cursor-pointer text-blue-200 hover:text-blue-100">
        View
      </summary>
      <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs leading-5 text-slate-300">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </details>
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
        <DataTable
          emptyText="No dashboard actions have been logged for this server yet."
          items={data.logs}
          columns={[
            {
              key: "actionType",
              label: "Action",
              render: (log) => <ActionBadge action={log.actionType} />,
            },
            {
              key: "entityType",
              label: "Entity",
              render: (log) => <EntityLabel log={log} />,
            },
            {
              key: "summary",
              label: "Summary",
              render: (log) => log.summary,
            },
            {
              key: "userId",
              label: "Actor",
              render: (log) => log.userId ?? <EmptyValue />,
            },
            {
              key: "metadata",
              label: "Metadata",
              render: (log) => <MetadataDetails metadata={log.metadata} />,
            },
            {
              key: "createdAt",
              label: "Timestamp",
              render: (log) => formatDashboardDate(log.createdAt),
            },
          ]}
        />
      ) : (
        <LoadError label="server logs" />
      )}
    </ServerSectionPlaceholder>
  );
}
