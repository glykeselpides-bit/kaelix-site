import PlanLockedNotice from "@/components/PlanLockedNotice";
import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import InsightsView, { type InsightsData } from "./InsightsView";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InsightsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  // First load in UTC; the page switches to the viewer's own time zone straight away.
  const data = await fetchServerSection<InsightsData | { allowed: false; planName: string }>(guildId, "insights?days=30&tz=UTC");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Insights"
      description="When your server is busiest, who's active, how many new members stick around, and which games bring people back. The same report as /insights in Discord, as charts."
    >
      {!data ? (
        <LoadError label="insights" />
      ) : !data.allowed ? (
        <PlanLockedNotice guildId={guildId} feature="Server insights" planName={data.planName}>
          Kaelix is already collecting this for your server (message counts only, never what people say), so the
          full history is here as soon as you upgrade.
        </PlanLockedNotice>
      ) : (
        <InsightsView guildId={guildId} initial={data} />
      )}
    </ServerSectionPlaceholder>
  );
}
