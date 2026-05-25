import { NextResponse } from "next/server";
import { invalidGuildIdResponse, parseGuildId } from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type OptionInput = {
  label: string;
  faction_id: number | null;
  weight: number;
  position: number;
  is_active: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePositiveInt(
  value: unknown,
  fieldName: string,
  errors: string[],
  options: { allowZero?: boolean; nullable?: boolean } = {}
) {
  if ((value === null || value === undefined) && options.nullable) {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    errors.push(`${fieldName} must be an integer.`);
    return undefined;
  }

  const min = options.allowZero ? 0 : 1;

  if (value < min) {
    errors.push(`${fieldName} must be ${options.allowZero ? "0 or greater" : "positive"}.`);
    return undefined;
  }

  return value;
}

function normalizeString(
  value: unknown,
  fieldName: string,
  errors: string[],
  maxLength?: number
) {
  if (typeof value !== "string") {
    errors.push(`${fieldName} must be a string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    errors.push(`${fieldName} is required.`);
    return undefined;
  }

  if (maxLength && trimmed.length > maxLength) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer.`);
    return undefined;
  }

  return trimmed;
}

function validateOptionInput(
  value: unknown,
  index: number,
  errors: string[]
): OptionInput | null {
  if (!isRecord(value)) {
    errors.push(`options[${index}] must be an object.`);
    return null;
  }

  const label = normalizeString(
    value.label,
    `options[${index}].label`,
    errors,
    300
  );
  const factionId =
    "factionId" in value
      ? parsePositiveInt(value.factionId, `options[${index}].factionId`, errors, {
          nullable: true,
        })
      : null;
  const weight =
    "weight" in value
      ? parsePositiveInt(value.weight, `options[${index}].weight`, errors)
      : 1;
  const position =
    "position" in value
      ? parsePositiveInt(value.position, `options[${index}].position`, errors, {
          allowZero: true,
        })
      : index;
  const isActive =
    "isActive" in value
      ? typeof value.isActive === "boolean"
        ? value.isActive
        : undefined
      : true;

  if ("isActive" in value && isActive === undefined) {
    errors.push(`options[${index}].isActive must be a boolean.`);
  }

  if (
    label === undefined ||
    factionId === undefined ||
    typeof weight !== "number" ||
    typeof position !== "number" ||
    isActive === undefined
  ) {
    return null;
  }

  return {
    label,
    faction_id: factionId,
    weight,
    position,
    is_active: isActive,
  };
}

function validateCreateQuestion(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];
  const question = normalizeString(body.question, "question", errors, 1000);
  const position =
    "position" in body
      ? parsePositiveInt(body.position, "position", errors, { allowZero: true })
      : null;
  const isActive =
    "isActive" in body
      ? typeof body.isActive === "boolean"
        ? body.isActive
        : undefined
      : true;

  if ("isActive" in body && isActive === undefined) {
    errors.push("isActive must be a boolean.");
  }

  const options = Array.isArray(body.options)
    ? body.options
        .map((option, index) => validateOptionInput(option, index, errors))
        .filter((option): option is OptionInput => option !== null)
    : [];

  if ("options" in body && !Array.isArray(body.options)) {
    errors.push("options must be an array.");
  }

  if (errors.length > 0 || question === undefined || isActive === undefined) {
    return { error: "Invalid quiz question payload.", details: errors };
  }

  return { question, position, isActive, options };
}

function validateCreateOption(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];
  const questionId = parsePositiveInt(body.questionId, "questionId", errors);
  const option = validateOptionInput(body, 0, errors);

  if (errors.length > 0 || typeof questionId !== "number" || option === null) {
    return { error: "Invalid quiz option payload.", details: errors };
  }

  return { questionId, option };
}

function validatePatch(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];

  if (body.type !== "question" && body.type !== "option") {
    errors.push("type must be 'question' or 'option'.");
  }

  const id = parsePositiveInt(body.id, "id", errors);
  const questionData: Partial<{
    question: string;
    position: number;
    is_active: boolean;
  }> = {};
  const optionData: Partial<{
    label: string;
    faction_id: number | null;
    weight: number;
    position: number;
    is_active: boolean;
  }> = {};

  if (body.type === "question") {
    if ("question" in body) {
      const question = normalizeString(body.question, "question", errors, 1000);
      if (question !== undefined) {
        questionData.question = question;
      }
    }

    if ("position" in body) {
      const position = parsePositiveInt(body.position, "position", errors, {
        allowZero: true,
      });
      if (typeof position === "number") {
        questionData.position = position;
      }
    }

    if ("isActive" in body) {
      if (typeof body.isActive === "boolean") {
        questionData.is_active = body.isActive;
      } else {
        errors.push("isActive must be a boolean.");
      }
    }
  }

  if (body.type === "option") {
    if ("label" in body) {
      const label = normalizeString(body.label, "label", errors, 300);
      if (label !== undefined) {
        optionData.label = label;
      }
    }

    if ("factionId" in body) {
      const factionId = parsePositiveInt(body.factionId, "factionId", errors, {
        nullable: true,
      });
      if (factionId !== undefined) {
        optionData.faction_id = factionId;
      }
    }

    if ("weight" in body) {
      const weight = parsePositiveInt(body.weight, "weight", errors);
      if (typeof weight === "number") {
        optionData.weight = weight;
      }
    }

    if ("position" in body) {
      const position = parsePositiveInt(body.position, "position", errors, {
        allowZero: true,
      });
      if (typeof position === "number") {
        optionData.position = position;
      }
    }

    if ("isActive" in body) {
      if (typeof body.isActive === "boolean") {
        optionData.is_active = body.isActive;
      } else {
        errors.push("isActive must be a boolean.");
      }
    }
  }

  if (errors.length > 0 || typeof id !== "number") {
    return { error: "Invalid quiz update payload.", details: errors };
  }

  const data = body.type === "question" ? questionData : optionData;

  if (Object.keys(data).length === 0) {
    return { error: "No supported quiz fields were provided." };
  }

  return { type: body.type, id, data };
}

function validateDelete(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];

  if (body.type !== "question" && body.type !== "option") {
    errors.push("type must be 'question' or 'option'.");
  }

  const id = parsePositiveInt(body.id, "id", errors);

  if (errors.length > 0 || typeof id !== "number") {
    return { error: "Invalid quiz delete payload.", details: errors };
  }

  return { type: body.type, id };
}

async function assertFactionsBelongToGuild(
  guildId: bigint,
  factionIds: number[]
) {
  if (factionIds.length === 0) {
    return true;
  }

  const prisma = getPrisma();
  const factions = await prisma.factions.findMany({
    where: { guild_id: guildId, id: { in: factionIds } },
    select: { id: true },
  });

  return factions.length === new Set(factionIds).size;
}

export async function POST(
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

  const validation =
    isRecord(body) && body.type === "option"
      ? validateCreateOption(body)
      : validateCreateQuestion(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    if ("option" in validation) {
      const existingQuestion = await prisma.faction_quiz_questions.findFirst({
        where: { id: validation.questionId, guild_id: guildIdBigInt },
        select: { id: true },
      });

      if (!existingQuestion) {
        return NextResponse.json(
          { error: "Quiz question was not found for this server." },
          { status: 404 }
        );
      }

      if (
        validation.option.faction_id !== null &&
        !(await assertFactionsBelongToGuild(guildIdBigInt, [
          validation.option.faction_id,
        ]))
      ) {
        return NextResponse.json(
          { error: "Faction was not found for this server." },
          { status: 404 }
        );
      }

      const option = await prisma.faction_quiz_options.create({
        data: {
          question_id: validation.questionId,
          ...validation.option,
        },
        select: { id: true },
      });

      return NextResponse.json({ optionId: option.id }, { status: 201 });
    }

    const factionIds = validation.options
      .map((option) => option.faction_id)
      .filter((factionId): factionId is number => factionId !== null);

    if (!(await assertFactionsBelongToGuild(guildIdBigInt, factionIds))) {
      return NextResponse.json(
        { error: "One or more factions were not found for this server." },
        { status: 404 }
      );
    }

    const position =
      validation.position ??
      ((await prisma.faction_quiz_questions.count({
        where: { guild_id: guildIdBigInt },
      })) + 1);

    const question = await prisma.faction_quiz_questions.create({
      data: {
        guild_id: guildIdBigInt,
        question: validation.question,
        position,
        is_active: validation.isActive,
        faction_quiz_options: {
          create: validation.options,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ questionId: question.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create onboarding quiz question", error);

    return NextResponse.json(
      { error: "Failed to create onboarding quiz question" },
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

  const validation = validatePatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();

    if (validation.type === "question") {
      const existingQuestion = await prisma.faction_quiz_questions.findFirst({
        where: { id: validation.id, guild_id: guildIdBigInt },
        select: { id: true },
      });

      if (!existingQuestion) {
        return NextResponse.json(
          { error: "Quiz question was not found for this server." },
          { status: 404 }
        );
      }

      await prisma.faction_quiz_questions.update({
        where: { id: validation.id },
        data: validation.data,
      });

      return NextResponse.json({ updated: true, type: "question" });
    }

    const existingOption = await prisma.faction_quiz_options.findFirst({
      where: {
        id: validation.id,
        faction_quiz_questions: { guild_id: guildIdBigInt },
      },
      select: { id: true },
    });

    if (!existingOption) {
      return NextResponse.json(
        { error: "Quiz option was not found for this server." },
        { status: 404 }
      );
    }

    if (
      "faction_id" in validation.data &&
      typeof validation.data.faction_id === "number" &&
      !(await assertFactionsBelongToGuild(guildIdBigInt, [
        validation.data.faction_id,
      ]))
    ) {
      return NextResponse.json(
        { error: "Faction was not found for this server." },
        { status: 404 }
      );
    }

    await prisma.faction_quiz_options.update({
      where: { id: validation.id },
      data: validation.data,
    });

    return NextResponse.json({ updated: true, type: "option" });
  } catch (error) {
    console.error("Failed to update onboarding quiz", error);

    return NextResponse.json(
      { error: "Failed to update onboarding quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  const validation = validateDelete(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();

    if (validation.type === "question") {
      const existingQuestion = await prisma.faction_quiz_questions.findFirst({
        where: { id: validation.id, guild_id: guildIdBigInt },
        select: { id: true },
      });

      if (!existingQuestion) {
        return NextResponse.json(
          { error: "Quiz question was not found for this server." },
          { status: 404 }
        );
      }

      await prisma.faction_quiz_questions.update({
        where: { id: validation.id },
        data: { is_active: false },
      });

      return NextResponse.json({ deactivated: true, type: "question" });
    }

    const existingOption = await prisma.faction_quiz_options.findFirst({
      where: {
        id: validation.id,
        faction_quiz_questions: { guild_id: guildIdBigInt },
      },
      select: { id: true },
    });

    if (!existingOption) {
      return NextResponse.json(
        { error: "Quiz option was not found for this server." },
        { status: 404 }
      );
    }

    await prisma.faction_quiz_options.update({
      where: { id: validation.id },
      data: { is_active: false },
    });

    return NextResponse.json({ deactivated: true, type: "option" });
  } catch (error) {
    console.error("Failed to deactivate onboarding quiz item", error);

    return NextResponse.json(
      { error: "Failed to deactivate onboarding quiz item" },
      { status: 500 }
    );
  }
}
