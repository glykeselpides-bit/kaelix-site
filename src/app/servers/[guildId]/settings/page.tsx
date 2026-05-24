import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  return (
    <ServerSectionPlaceholder
      params={params}
      title="Settings"
      description="Configure Kaelix systems, notifications, channels, rewards, and server preferences."
    />
  );
}