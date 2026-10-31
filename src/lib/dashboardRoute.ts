import { NextResponse } from "next/server";
import { invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";
import { guardGuild } from "@/lib/guildAccess";

/**
 * Shared bits for the dashboard API routes that edit the bot's own tables
 * (welcome, AutoMod, leveling, Autopilot, stream alerts).
 */

/** The server ID as a bigint, or the response to send back (not logged in, can't manage it, bad ID). */
export async function routeGuild(
  params: Promise<{ guildId: string }>
): Promise<bigint | NextResponse> {
  const { guildId } = await params;

  const denied = await guardGuild(guildId);
  if (denied) return denied;

  const id = parseGuildId(guildId);
  return id ?? invalidGuildIdResponse();
}

export function badRequest(error: string, details?: string[]) {
  return NextResponse.json(details?.length ? { error, details } : { error }, { status: 400 });
}

export function serverError(what: string, error: unknown) {
  console.error(`Failed to ${what}`, error);
  return NextResponse.json({ error: `Failed to ${what}.` }, { status: 500 });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The JSON body as an object, or a 400 response. */
export async function readBody(request: Request): Promise<Record<string, unknown> | NextResponse> {
  try {
    const body = await request.json();
    return isRecord(body) ? body : badRequest("Request body must be a JSON object.");
  } catch {
    return badRequest("Request body must be valid JSON.");
  }
}

/**
 * Collects field errors while reading a request body. Each reader returns
 * undefined when the field is missing or invalid (and records why).
 */
export class Fields {
  errors: string[] = [];

  constructor(private body: Record<string, unknown>) {}

  has(name: string) {
    return name in this.body;
  }

  bool(name: string): boolean | undefined {
    if (!this.has(name)) return undefined;
    const value = this.body[name];
    if (typeof value === "boolean") return value;
    this.errors.push(`${name} must be true or false.`);
    return undefined;
  }

  int(name: string, min: number, max: number): number | undefined {
    if (!this.has(name)) return undefined;
    const value = this.body[name];
    if (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max) return value;
    this.errors.push(`${name} must be a whole number from ${min} to ${max}.`);
    return undefined;
  }

  number(name: string, min: number, max: number): number | undefined {
    if (!this.has(name)) return undefined;
    const value = this.body[name];
    if (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max) return value;
    this.errors.push(`${name} must be a number from ${min} to ${max}.`);
    return undefined;
  }

  /** Trimmed text; empty becomes null when allowEmpty, otherwise an error. */
  text(name: string, maxLength: number, allowEmpty = false): string | null | undefined {
    if (!this.has(name)) return undefined;
    const value = this.body[name];
    if (value === null && allowEmpty) return null;
    if (typeof value !== "string") {
      this.errors.push(`${name} must be text.`);
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      if (allowEmpty) return null;
      this.errors.push(`${name} can't be empty.`);
      return undefined;
    }
    if (trimmed.length > maxLength) {
      this.errors.push(`${name} must be ${maxLength} characters or fewer.`);
      return undefined;
    }
    return trimmed;
  }

  /** A Discord ID. Empty or null clears it (returns null). */
  snowflake(name: string): bigint | null | undefined {
    if (!this.has(name)) return undefined;
    const value = this.body[name];
    if (value === null || value === "") return null;
    if (typeof value === "string" && /^\d{5,25}$/.test(value.trim())) return BigInt(value.trim());
    this.errors.push(`${name} must be a Discord ID.`);
    return undefined;
  }

  /** A list of Discord IDs, kept as strings (that's how the bot stores them in JSON). */
  snowflakeList(name: string, max: number): string[] | undefined {
    if (!this.has(name)) return undefined;
    const value = this.body[name];
    if (!Array.isArray(value) || value.length > max) {
      this.errors.push(`${name} must be a list of up to ${max} Discord IDs.`);
      return undefined;
    }
    const ids: string[] = [];
    for (const item of value) {
      const text = typeof item === "string" ? item.trim() : typeof item === "number" ? String(item) : "";
      if (!/^\d{5,25}$/.test(text)) {
        this.errors.push(`${name} must only contain Discord IDs.`);
        return undefined;
      }
      if (!ids.includes(text)) ids.push(text);
    }
    return ids;
  }

  oneOf<T extends string>(name: string, choices: readonly T[]): T | undefined {
    if (!this.has(name)) return undefined;
    const value = this.body[name];
    if (typeof value === "string" && (choices as readonly string[]).includes(value)) return value as T;
    this.errors.push(`${name} must be one of: ${choices.join(", ")}.`);
    return undefined;
  }

  /** Throw-away convenience: true if anything went wrong. */
  get failed() {
    return this.errors.length > 0;
  }
}

/** True if Node knows this IANA time zone (the bot uses the same names). */
export function isTimeZone(name: string): boolean {
  if (!name || name.length > 50) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: name });
    return true;
  } catch {
    return false;
  }
}
