import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  DataTable,
  EmptyValue,
  LoadError,
} from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FactionItem = {
  name: string;
  key: string;
  emoji: string | null;
  roleId: string | null;
  status: string;
};

type FactionsData = {
  factions: FactionItem[];
};

export default async function FactionsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = await fetchServerSection<FactionsData>(guildId, "factions");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Factions"
      description="Manage factions, roles, onboarding assignments, and progression systems."
    >
      {data ? (
        <DataTable
          emptyText="No active factions found for this server yet."
          items={data.factions}
          columns={[
            { key: "name", label: "Name", render: (faction) => faction.name },
            { key: "key", label: "Key", render: (faction) => faction.key },
            {
              key: "emoji",
              label: "Emoji",
              render: (faction) => faction.emoji ?? <EmptyValue />,
            },
            {
              key: "roleId",
              label: "Role ID",
              render: (faction) => faction.roleId ?? <EmptyValue />,
            },
            {
              key: "status",
              label: "Status",
              render: (faction) => faction.status,
            },
          ]}
        />
      ) : (
        <LoadError label="server factions" />
      )}
    </ServerSectionPlaceholder>
  );
}
