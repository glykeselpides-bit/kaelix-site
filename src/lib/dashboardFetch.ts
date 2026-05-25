import { headers } from "next/headers";

export async function fetchServerSection<T>(guildId: string, section: string) {
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
      `${baseUrl}/api/servers/${encodeURIComponent(guildId)}/${section}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}
