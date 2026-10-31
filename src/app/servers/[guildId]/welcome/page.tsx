import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { LoadError } from "@/components/ServerReadOnlySection";
import { fetchServerSection } from "@/lib/dashboardFetch";
import WelcomeForm, { type WelcomeSettings } from "./WelcomeForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WelcomeData = { settings: WelcomeSettings; cardsAllowed: boolean; cardsPlan: string };

export default async function WelcomePage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const data = await fetchServerSection<WelcomeData>(guildId, "welcome");

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Welcome & Goodbye"
      description="Greet new members and say goodbye when they leave, with an optional image card showing their avatar."
    >
      {data ? (
        <WelcomeForm guildId={guildId} initial={data.settings} cardsAllowed={data.cardsAllowed} cardsPlan={data.cardsPlan} />
      ) : (
        <LoadError label="welcome settings" />
      )}
    </ServerSectionPlaceholder>
  );
}
