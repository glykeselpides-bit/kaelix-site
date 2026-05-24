import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function LogsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  return (
    <ServerSectionPlaceholder
      params={params}
      title="Logs"
      description="View and analyze server logs, events, and system activities."
    />
  );
}