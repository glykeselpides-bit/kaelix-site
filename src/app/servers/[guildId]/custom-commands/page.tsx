import PlanLockedNotice from "@/components/PlanLockedNotice";
import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import CustomCommandsManager, { type CustomCommandsData } from "./CustomCommandsManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CustomCommandsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const data = await fetchServerSection<CustomCommandsData>(guildId, "custom-commands");
  const saved = data ? data.commands.length + data.responders.length : 0;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Custom Commands"
      description="Your server's own !commands, and automatic replies when someone says a trigger word."
    >
      {!data ? (
        <LoadError label="custom commands" />
      ) : data.limits.commands === 0 && data.limits.responders === 0 ? (
        <PlanLockedNotice guildId={guildId} feature="Custom commands and auto-responders" planName="Core">
          Core includes 2 of each, Pro and Elite unlimited, and on Pro a command can also give or take a role.
          {saved > 0 ? ` This server has ${saved} saved from before; they start working again when you upgrade.` : ""}
        </PlanLockedNotice>
      ) : (
        <CustomCommandsManager guildId={guildId} initial={data} />
      )}
    </ServerSectionPlaceholder>
  );
}
