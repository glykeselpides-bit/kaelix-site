import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import ModerationManager, { type AutoModSettings, type ModCase } from "./ModerationManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ModerationData = {
  settings: AutoModSettings;
  advancedAllowed: boolean;
  advancedPlan: string;
  lastThirtyDays: Record<string, number>;
  cases: ModCase[];
};

export default async function ModerationPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const data = await fetchServerSection<ModerationData>(guildId, "moderation");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="AutoMod & Moderation"
      description="Choose what AutoMod removes automatically, and review the warnings, timeouts, kicks and bans in this server."
    >
      {data ? (
        <ModerationManager
          guildId={guildId}
          initial={data.settings}
          advancedAllowed={data.advancedAllowed}
          advancedPlan={data.advancedPlan}
          lastThirtyDays={data.lastThirtyDays}
          cases={data.cases}
        />
      ) : (
        <LoadError label="moderation settings" />
      )}
    </ServerSectionPlaceholder>
  );
}
