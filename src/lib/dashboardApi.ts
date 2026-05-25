import { NextResponse } from "next/server";

export function parseGuildId(guildId: string) {
  if (!/^\d+$/.test(guildId)) {
    return null;
  }

  return BigInt(guildId);
}

export function invalidGuildIdResponse() {
  return NextResponse.json(
    { error: "Invalid Discord server ID" },
    { status: 400 }
  );
}

export function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function formatBigInt(value: bigint | null | undefined) {
  return value === null || value === undefined ? null : value.toString();
}
