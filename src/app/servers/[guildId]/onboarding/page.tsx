import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { fetchServerSection } from "@/lib/dashboardFetch";
import OnboardingManager, {
  type OnboardingFaction,
  type OnboardingQuiz,
  type OnboardingSettings,
  type SkippedOnboardingField,
} from "./OnboardingManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type OnboardingData = {
  found?: boolean;
  onboarding: OnboardingSettings | null;
  quizzes: OnboardingQuiz[];
  factions: OnboardingFaction[];
  skippedFields: SkippedOnboardingField[];
  metrics: {
    onboardingEnabled: boolean;
    activeQuizCount: number;
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
  const onboarding = data?.found === true ? data.onboarding : null;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Onboarding"
      description="Manage onboarding processes, tutorials, and user initiation workflows."
    >
      <OnboardingManager
        guildId={guildId}
        initialOnboarding={onboarding}
        quizzes={data?.quizzes ?? []}
        factions={data?.factions ?? []}
        skippedFields={data?.skippedFields ?? []}
        loadError={!onboarding}
      />
    </ServerSectionPlaceholder>
  );
}
