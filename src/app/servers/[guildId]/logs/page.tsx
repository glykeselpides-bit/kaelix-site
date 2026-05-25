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
  actionType: string;
  entityType: string;
  actorId: string | null;
  targetUserId: string | null;
  createdAt: string | null;
};

type LogsData = {
  logs: LogItem[];
};

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
      description="View and analyze server logs, events, and system activities."
    >
      {data ? (
        <DataTable
          emptyText="No audit logs found for this server yet."
          items={data.logs}
          columns={[
            {
              key: "actionType",
              label: "Action Type",
              render: (log) => log.actionType,
            },
            {
              key: "entityType",
              label: "Entity Type",
              render: (log) => log.entityType,
            },
            {
              key: "actorId",
              label: "Actor ID",
              render: (log) => log.actorId ?? <EmptyValue />,
            },
            {
              key: "targetUserId",
              label: "Target User ID",
              render: (log) => log.targetUserId ?? <EmptyValue />,
            },
            {
              key: "createdAt",
              label: "Created At",
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
