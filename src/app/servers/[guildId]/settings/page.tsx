import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { fetchServerSection } from "@/lib/dashboardFetch";
import SettingsForm, { type EditableServerSettings } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SettingsData = {
  found?: boolean;
  settings?: Partial<EditableServerSettings>;
  error?: string;
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = await fetchServerSection<SettingsData>(guildId, "settings");
  const settings = data?.found === true ? data.settings ?? null : null;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Settings"
      description="Configure Kaelix systems, notifications, schedule preferences, and server defaults."
    >
      <SettingsForm
        guildId={guildId}
        initialSettings={settings}
        loadError={!settings}
      />
    </ServerSectionPlaceholder>
  );
}
