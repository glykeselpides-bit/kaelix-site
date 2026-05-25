import { headers } from "next/headers";
import ServerSectionPlaceholder from "@/components/ServerSectionPlaceholder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getSettings(guildId: string) {
  try {
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
        ? "http"
        : "https");

    if (!host) {
      return null;
    }

    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(
      `${baseUrl}/api/servers/${encodeURIComponent(guildId)}/settings`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  const data = await getSettings(guildId);

  const settings = data?.settings;

  return (
    <ServerSectionPlaceholder
      params={params}
      title="Settings"
      description="Configure Kaelix systems, notifications, channels, rewards, and server preferences."
    >
      {settings ? (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
              Systems
            </p>

            <div className="mt-5 space-y-3 text-slate-300">
              <p>
                Activities:{" "}
                <span className="text-white">
                  {settings.activities ? "Enabled" : "Disabled"}
                </span>
              </p>

              <p>
                Achievements:{" "}
                <span className="text-white">
                  {settings.achievements ? "Enabled" : "Disabled"}
                </span>
              </p>

              <p>
                Onboarding:{" "}
                <span className="text-white">
                  {settings.onboarding ? "Enabled" : "Disabled"}
                </span>
              </p>

              <p>
                Weekly Summary:{" "}
                <span className="text-white">
                  {settings.weeklySummary ? "Enabled" : "Disabled"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
              Points
            </p>

            <div className="mt-5 space-y-3 text-slate-300">
              <p>
                Message Points:{" "}
                <span className="text-white">
                  {settings.messagePoints ? "Enabled" : "Disabled"}
                </span>
              </p>

              <p>
                Reaction Points:{" "}
                <span className="text-white">
                  {settings.reactionPoints ? "Enabled" : "Disabled"}
                </span>
              </p>

              <p>
                Voice Points:{" "}
                <span className="text-white">
                  {settings.voicePoints ? "Enabled" : "Disabled"}
                </span>
              </p>

              <p>
                Points Per Message:{" "}
                <span className="text-white">
                  {settings.pointsPerMessage}
                </span>
              </p>

              <p>
                Points Per Reaction:{" "}
                <span className="text-white">
                  {settings.pointsPerReaction}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-red-200">
          Failed to load server settings.
        </div>
      )}
    </ServerSectionPlaceholder>
  );
}
