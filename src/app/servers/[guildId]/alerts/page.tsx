import PlanLockedNotice from "@/components/PlanLockedNotice";
import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import AlertsManager, { type AlertsData } from "./AlertsManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AlertsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const data = await fetchServerSection<AlertsData>(guildId, "alerts");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Stream Alerts"
      description="Post in your server when a Twitch or Kick streamer goes live, or a YouTube channel uploads."
    >
      {!data ? (
        <LoadError label="stream alerts" />
      ) : data.limit === 0 ? (
        <PlanLockedNotice guildId={guildId} feature="Stream alerts" planName="Pro">
          Pro follows up to 10 Twitch, Kick or YouTube channels, Elite as many as you like.
          {data.alerts.length > 0
            ? ` This server has ${data.alerts.length} alert${data.alerts.length === 1 ? "" : "s"} saved from before; they start again when you upgrade.`
            : ""}
        </PlanLockedNotice>
      ) : (
        <AlertsManager guildId={guildId} initial={data} />
      )}
    </ServerSectionPlaceholder>
  );
}
