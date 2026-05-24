import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function EventsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  return (
    <ServerSectionPlaceholder
      params={params}
      title="Events"
      description="Manage Kaelix events, reminders, registrations, and attendance systems."
    />
  );
}