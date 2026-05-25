import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError, MetricGrid } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OnboardingData = {
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
  const metrics = data?.metrics;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Onboarding"
      description="Manage onboarding processes, tutorials, and user initiation workflows."
    >
      {metrics ? (
        <MetricGrid
          metrics={[
            {
              label: "Onboarding",
              value: metrics.onboardingEnabled ? "Enabled" : "Disabled",
            },
            { label: "Active Quizzes", value: metrics.activeQuizCount },
            {
              label: "Completed Sessions",
              value: metrics.completedSessionsCount,
            },
            { label: "Assigned Users", value: metrics.assignedUsersCount },
          ]}
        />
      ) : (
        <LoadError label="server onboarding" />
      )}
    </ServerSectionPlaceholder>
  );
}
