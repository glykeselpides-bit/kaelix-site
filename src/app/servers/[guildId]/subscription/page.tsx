import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SubscriptionPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  return (
    <ServerSectionPlaceholder
      params={params}
      title="Subscription"
      description="Manage subscription plans, billing, and user access levels."
    />
  );
}