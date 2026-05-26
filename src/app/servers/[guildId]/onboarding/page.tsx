import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import OnboardingManager, {
  type OnboardingFaction,
  type OnboardingQuizQuestion,
  type OnboardingSettings,
} from "./OnboardingManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type OnboardingData = {
  found?: boolean;
  settings: OnboardingSettings | null;
  questions: OnboardingQuizQuestion[];
  factions: OnboardingFaction[];
  metrics: {
    onboardingEnabled: boolean;
    activeQuestionCount: number;
    completedSessionsCount: number;
    assignedUsersCount: number;
  };
};

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = await fetchServerSection<OnboardingData>(guildId, "onboarding");
  const settings = data?.found === true ? data.settings : null;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Onboarding"
      description="Manage onboarding processes, tutorials, and user initiation workflows."
    >
      {data ? (
        <OnboardingManager
          guildId={guildId}
          initialSettings={settings}
          initialQuestions={data.questions ?? []}
          factions={data.factions ?? []}
        />
      ) : (
        <LoadError label="server onboarding" />
      )}
    </ServerSectionPlaceholder>
  );
}
