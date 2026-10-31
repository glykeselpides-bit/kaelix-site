import PlanLockedNotice from "@/components/PlanLockedNotice";
import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import LevelingManager, { type LevelingSettings, type RoleReward } from "./LevelingManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LevelingData = {
  allowed: boolean;
  planName: string;
  settings: LevelingSettings;
  rewards: RoleReward[];
  maxRewards: number;
};

export default async function LevelingPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const data = await fetchServerSection<LevelingData>(guildId, "leveling");
  const description =
    "Give roles as members level up, choose where level-ups are announced, boost XP for certain roles or channels, and stop XP farming.";

  return (
    <ServerSectionPlaceholder params={params} title="Leveling" description={description}>
      {!data ? (
        <LoadError label="leveling settings" />
      ) : !data.allowed ? (
        <PlanLockedNotice guildId={guildId} feature="Leveling rewards and settings" planName={data.planName}>
          Every plan has XP and levels. Upgrade to give roles at each level, send level-ups to a channel of your
          choice, boost XP for roles or channels, and switch on anti-farming.
          {data.rewards.length > 0
            ? ` This server still has ${data.rewards.length} role reward${data.rewards.length === 1 ? "" : "s"} saved from before; they come back when you upgrade.`
            : ""}
        </PlanLockedNotice>
      ) : (
        <LevelingManager guildId={guildId} initial={data.settings} initialRewards={data.rewards} maxRewards={data.maxRewards} />
      )}
    </ServerSectionPlaceholder>
  );
}
