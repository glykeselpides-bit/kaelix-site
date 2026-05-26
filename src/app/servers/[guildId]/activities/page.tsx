import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";
import { fetchServerSection } from "@/lib/dashboardFetch";
import TriviaQuestionsManager, {
  type TriviaQuestion,
} from "./TriviaQuestionsManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TriviaData = {
  questions: TriviaQuestion[];
  total: number;
  warnings?: string[];
};

const fallbackTriviaData: TriviaData = {
  questions: [],
  total: 0,
  warnings: ["Trivia question defaults are shown until saved content is available."],
};

function normalizeTriviaData(data: TriviaData | null): TriviaData {
  if (!data || typeof data !== "object") {
    return fallbackTriviaData;
  }

  return {
    questions: Array.isArray(data.questions) ? data.questions : [],
    total:
      typeof data.total === "number" && Number.isFinite(data.total)
        ? data.total
        : 0,
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
}

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const triviaData = await fetchServerSection<TriviaData>(
    guildId,
    "activities/trivia?includeInactive=true"
  ).then(normalizeTriviaData);

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Activities"
      description="Manage activities, challenges, and engagement systems."
    >
      <div className="space-y-6">
        <TriviaQuestionsManager guildId={guildId} initialPayload={triviaData} />
      </div>
    </ServerSectionPlaceholder>
  );
}
