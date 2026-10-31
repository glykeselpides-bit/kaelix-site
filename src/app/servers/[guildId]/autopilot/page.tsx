import PlanLockedNotice from "@/components/PlanLockedNotice";
import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import AutopilotManager, { type AutopilotData } from "./AutopilotManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AutopilotPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const data = await fetchServerSection<AutopilotData>(guildId, "autopilot");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Activity Autopilot"
      description="Run games on a daily or weekly schedule in your server's own time zone, with an optional reminder and role ping. They start and finish by themselves."
    >
      {!data ? (
        <LoadError label="Autopilot schedules" />
      ) : data.limit === 0 ? (
        <PlanLockedNotice guildId={guildId} feature="Activity Autopilot" planName="Pro">
          Pro runs up to 10 schedules, Elite as many as you like.
          {data.schedules.length > 0
            ? ` This server has ${data.schedules.length} schedule${data.schedules.length === 1 ? "" : "s"} saved from before; they start again when you upgrade.`
            : ""}
        </PlanLockedNotice>
      ) : (
        <AutopilotManager guildId={guildId} initial={data} />
      )}
    </ServerSectionPlaceholder>
  );
}
