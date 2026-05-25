import { NextResponse } from "next/server";
import {
  formatBigInt,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const DIGEST_DAYS = new Set([0, 1, 2, 3, 4, 5, 6]);

type SettingsResponse = {
  weekly_digest_enabled: boolean;
  weekly_digest_day: number;
  weekly_digest_hour: number;
  welcome_enabled: boolean;
  notifications_enabled: boolean;
  default_timezone: string;
  event_reminders_enabled: boolean;
  welcome_channel_id: string | null;
  digest_channel_id: string | null;
  logs_channel_id: string | null;
  events_channel_id: string | null;
  activity_channel_id: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getExtraSettings(value: Prisma.JsonValue): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function toSettingsResponse(config: {
  weekly_summary_enabled: boolean;
  weekly_summary_day: number;
  weekly_summary_hour: number;
  send_dm_notifications: boolean;
  welcome_channel_id: bigint | null;
  event_reminder_channel_id: bigint | null;
  admin_log_channel_id: bigint | null;
  weekly_summary_channel_id: bigint | null;
  extra_settings: Prisma.JsonValue;
}): SettingsResponse {
  const extraSettings = getExtraSettings(config.extra_settings);

  return {
    weekly_digest_enabled: config.weekly_summary_enabled,
    weekly_digest_day: config.weekly_summary_day,
    weekly_digest_hour: config.weekly_summary_hour,
    welcome_enabled:
      typeof extraSettings.welcome_enabled === "boolean"
        ? extraSettings.welcome_enabled
        : Boolean(config.welcome_channel_id),
    notifications_enabled: config.send_dm_notifications,
    default_timezone:
      typeof extraSettings.default_timezone === "string"
        ? extraSettings.default_timezone
        : "UTC",
    event_reminders_enabled:
      typeof extraSettings.event_reminders_enabled === "boolean"
        ? extraSettings.event_reminders_enabled
        : Boolean(config.event_reminder_channel_id),
    welcome_channel_id: formatBigInt(config.welcome_channel_id),
    digest_channel_id: formatBigInt(config.weekly_summary_channel_id),
    logs_channel_id: formatBigInt(config.admin_log_channel_id),
    events_channel_id: formatBigInt(config.event_reminder_channel_id),
    activity_channel_id:
      typeof extraSettings.activity_channel_id === "string" &&
      extraSettings.activity_channel_id
        ? extraSettings.activity_channel_id
        : null,
  };
}

function parseOptionalSnowflake(
  value: unknown,
  fieldName: string,
  errors: string[]
) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    errors.push(`${fieldName} must be a Discord snowflake string.`);
    return undefined;
  }

  return BigInt(trimmed);
}

function validateSettingsPatch(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const data: Prisma.guild_configUpdateInput = {};
  const extraSettingsPatch: Record<string, boolean | string | null> = {};
  const errors: string[] = [];

  if ("weekly_digest_enabled" in body) {
    if (typeof body.weekly_digest_enabled === "boolean") {
      data.weekly_summary_enabled = body.weekly_digest_enabled;
    } else {
      errors.push("weekly_digest_enabled must be a boolean.");
    }
  }

  if ("weekly_digest_day" in body) {
    if (
      typeof body.weekly_digest_day === "number" &&
      Number.isInteger(body.weekly_digest_day) &&
      DIGEST_DAYS.has(body.weekly_digest_day)
    ) {
      data.weekly_summary_day = body.weekly_digest_day;
    } else {
      errors.push("weekly_digest_day must be an integer from 0 to 6.");
    }
  }

  if ("weekly_digest_hour" in body) {
    if (
      typeof body.weekly_digest_hour === "number" &&
      Number.isInteger(body.weekly_digest_hour) &&
      body.weekly_digest_hour >= 0 &&
      body.weekly_digest_hour <= 23
    ) {
      data.weekly_summary_hour = body.weekly_digest_hour;
    } else {
      errors.push("weekly_digest_hour must be an integer from 0 to 23.");
    }
  }

  if ("welcome_enabled" in body) {
    if (typeof body.welcome_enabled === "boolean") {
      extraSettingsPatch.welcome_enabled = body.welcome_enabled;
    } else {
      errors.push("welcome_enabled must be a boolean.");
    }
  }

  if ("notifications_enabled" in body) {
    if (typeof body.notifications_enabled === "boolean") {
      data.send_dm_notifications = body.notifications_enabled;
    } else {
      errors.push("notifications_enabled must be a boolean.");
    }
  }

  if ("default_timezone" in body) {
    if (typeof body.default_timezone === "string") {
      const timezone = body.default_timezone.trim();

      if (
        timezone.length > 0 &&
        timezone.length <= 64 &&
        /^[A-Za-z0-9_+\-/.]+$/.test(timezone)
      ) {
        extraSettingsPatch.default_timezone = timezone;
      } else {
        errors.push(
          "default_timezone must be 1-64 characters using letters, numbers, '/', '.', '_', '+', or '-'."
        );
      }
    } else {
      errors.push("default_timezone must be a string.");
    }
  }

  if ("event_reminders_enabled" in body) {
    if (typeof body.event_reminders_enabled === "boolean") {
      extraSettingsPatch.event_reminders_enabled =
        body.event_reminders_enabled;
    } else {
      errors.push("event_reminders_enabled must be a boolean.");
    }
  }

  if ("welcome_channel_id" in body) {
    const channelId = parseOptionalSnowflake(
      body.welcome_channel_id,
      "welcome_channel_id",
      errors
    );

    if (channelId !== undefined) {
      data.welcome_channel_id = channelId;
    }
  }

  if ("digest_channel_id" in body) {
    const channelId = parseOptionalSnowflake(
      body.digest_channel_id,
      "digest_channel_id",
      errors
    );

    if (channelId !== undefined) {
      data.weekly_summary_channel_id = channelId;
    }
  }

  if ("logs_channel_id" in body) {
    const channelId = parseOptionalSnowflake(
      body.logs_channel_id,
      "logs_channel_id",
      errors
    );

    if (channelId !== undefined) {
      data.admin_log_channel_id = channelId;
    }
  }

  if ("events_channel_id" in body) {
    const channelId = parseOptionalSnowflake(
      body.events_channel_id,
      "events_channel_id",
      errors
    );

    if (channelId !== undefined) {
      data.event_reminder_channel_id = channelId;
    }
  }

  if ("activity_channel_id" in body) {
    const channelId = parseOptionalSnowflake(
      body.activity_channel_id,
      "activity_channel_id",
      errors
    );

    if (channelId !== undefined) {
      extraSettingsPatch.activity_channel_id = channelId?.toString() ?? null;
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid settings payload.", details: errors };
  }

  return { data, extraSettingsPatch };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return invalidGuildIdResponse();
  }

  try {
    const prisma = getPrisma();
    const config = await prisma.guild_config.findUnique({
      where: {
        guild_id: guildIdBigInt,
      },
    });

    if (!config) {
      return NextResponse.json({
        found: false,
        message: "No settings found for this server yet.",
      });
    }

    return NextResponse.json({
      found: true,
      settings: toSettingsResponse(config),
    });
  } catch (error) {
    console.error("Failed to load server settings", error);

    return NextResponse.json(
      { error: "Failed to load server settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return invalidGuildIdResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const validation = validateSettingsPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existingConfig = await prisma.guild_config.findUnique({
      where: { guild_id: guildIdBigInt },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "No settings found for this server yet." },
        { status: 404 }
      );
    }

    const hasExtraSettingsPatch =
      Object.keys(validation.extraSettingsPatch).length > 0;
    const updateData: Prisma.guild_configUpdateInput = {
      ...validation.data,
    };

    if (hasExtraSettingsPatch) {
      updateData.extra_settings = {
        ...getExtraSettings(existingConfig.extra_settings),
        ...validation.extraSettingsPatch,
      } as Prisma.InputJsonObject;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No supported settings were provided." },
        { status: 400 }
      );
    }

    const updatedConfig = await prisma.guild_config.update({
      where: { guild_id: guildIdBigInt },
      data: updateData,
    });

    return NextResponse.json({
      found: true,
      settings: toSettingsResponse(updatedConfig),
    });
  } catch (error) {
    console.error("Failed to update server settings", error);

    return NextResponse.json(
      { error: "Failed to update server settings" },
      { status: 500 }
    );
  }
}
