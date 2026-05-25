import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { fetchServerSection } from "@/lib/dashboardFetch";
import FactionsManager, { type FactionItem } from "./FactionsManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

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
      <FactionsManager
        guildId={guildId}
        initialFactions={data?.factions ?? []}
        loadError={!data}
      />
    </ServerSectionPlaceholder>
  );
}
