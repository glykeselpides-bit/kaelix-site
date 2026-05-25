import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { fetchServerSection } from "@/lib/dashboardFetch";
import EventsManager, { type EventItem } from "./EventsManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

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
      <EventsManager
        guildId={guildId}
        currentYear={new Date().getFullYear()}
        initialEvents={data?.events ?? []}
        loadError={!data}
      />
    </ServerSectionPlaceholder>
  );
}
