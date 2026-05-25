import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import {
  DetailsGrid,
  LoadError,
  formatDashboardDate,
} from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SubscriptionData = {
  subscription: {
    plan: string;
    status: string;
    trialUsed: boolean;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
};

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const data = await fetchServerSection<SubscriptionData>(
    guildId,
    "subscription"
  );
  const subscription = data?.subscription;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Subscription"
      description="Manage subscription plans, billing, and user access levels."
    >
      {subscription ? (
        <DetailsGrid
          items={[
            { label: "Plan", value: subscription.plan },
            { label: "Status", value: subscription.status },
            {
              label: "Trial Used",
              value: subscription.trialUsed ? "Yes" : "No",
            },
            {
              label: "Trial Ends At",
              value: formatDashboardDate(subscription.trialEndsAt),
            },
            {
              label: "Current Period End",
              value: formatDashboardDate(subscription.currentPeriodEnd),
            },
            {
              label: "Cancel At Period End",
              value: subscription.cancelAtPeriodEnd ? "Yes" : "No",
            },
          ]}
        />
      ) : (
        <LoadError label="server subscription" />
      )}
    </ServerSectionPlaceholder>
  );
}
