import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  DataTable,
  LoadError,
  formatDashboardDate,
} from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EventItem = {
  name: string;
  eventCode: string;
  startsAt: string | null;
  status: string;
  rewardPoints: number;
};

type EventsData = {
  events: EventItem[];
};

export default async function EventsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = await fetchServerSection<EventsData>(guildId, "events");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Events"
      description="Manage Kaelix events, reminders, registrations, and attendance systems."
    >
      {data ? (
        <DataTable
          emptyText="No events found for this server yet."
          items={data.events}
          columns={[
            { key: "name", label: "Name", render: (event) => event.name },
            {
              key: "eventCode",
              label: "Code",
              render: (event) => event.eventCode,
            },
            {
              key: "startsAt",
              label: "Starts At",
              render: (event) => formatDashboardDate(event.startsAt),
            },
            {
              key: "status",
              label: "Status",
              render: (event) => event.status,
            },
            {
              key: "rewardPoints",
              label: "Reward Points",
              render: (event) => event.rewardPoints,
            },
          ]}
        />
      ) : (
        <LoadError label="server events" />
      )}
    </ServerSectionPlaceholder>
  );
}
