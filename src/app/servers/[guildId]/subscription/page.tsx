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
    billingActive?: boolean;
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
        <div className="space-y-5">
          <DetailsGrid
            items={[
              { label: "Current plan", value: subscription.plan },
              { label: "Plan status", value: subscription.status },
              {
                label: "Trial used",
                value: subscription.trialUsed ? "Yes" : "No",
              },
              {
                label: "Trial ends",
                value: formatDashboardDate(subscription.trialEndsAt),
              },
              {
                label: "Renewal date",
                value: formatDashboardDate(subscription.currentPeriodEnd),
              },
              {
                label: "Cancels at period end",
                value: subscription.cancelAtPeriodEnd ? "Yes" : "No",
              },
            ]}
          />
        </div>
      ) : (
        <LoadError label="server subscription" />
      )}
    </ServerSectionPlaceholder>
  );
}
