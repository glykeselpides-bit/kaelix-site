import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  return (
    <ServerSectionPlaceholder
      params={params}
      title="Onboarding"
      description="Manage onboarding processes, tutorials, and user initiation workflows."
    />
  );
}