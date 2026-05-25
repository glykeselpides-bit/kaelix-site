import { NextResponse } from "next/server";
import {
  formatBigInt,
  formatDate,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

const triviaQuestionSelect = {
  id: true,
  guild_id: true,
  category: true,
  question_type: true,
  question: true,
  answer: true,
  difficulty: true,
  reward_points: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.trivia_questionsSelect;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toQuestionResponse(question: {
  id: number;
  guild_id: bigint | null;
  category: string;
  question_type: string;
  question: string;
  answer: string;
  difficulty: string | null;
  reward_points: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: question.id,
    guildId: formatBigInt(question.guild_id),
    scope: question.guild_id ? "guild" : "global",
    category: question.category,
    questionType: question.question_type,
    question: question.question,
    answer: question.answer,
    difficulty: question.difficulty,
    rewardPoints: question.reward_points,
    isActive: question.is_active,
    createdAt: formatDate(question.created_at),
    updatedAt: formatDate(question.updated_at),
  };
}

function validateQuestionCreate(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const errors: string[] = [];
  const data: Prisma.trivia_questionsUncheckedCreateInput = {
    category: "General",
    question_type: "open",
    question: "",
    answer: "",
    is_active: true,
  };

  if (typeof body.question === "string") {
    const question = body.question.trim();

    if (question.length > 0 && question.length <= 500) {
      data.question = question;
    } else {
      errors.push("question must be 1-500 characters.");
    }
  } else {
    errors.push("question is required.");
  }

  if (typeof body.answer === "string") {
    const answer = body.answer.trim();

    if (answer.length > 0 && answer.length <= 200) {
      data.answer = answer;
    } else {
      errors.push("answer must be 1-200 characters.");
    }
  } else {
    errors.push("answer is required.");
  }

  if ("category" in body) {
    const category = normalizeOptionalString(body.category);

    if (category === undefined || (category && category.length > 100)) {
      errors.push("category must be 100 characters or fewer.");
    } else {
      data.category = category ?? "General";
    }
  }

  if ("difficulty" in body) {
    const difficulty = normalizeOptionalString(body.difficulty);

    if (
      difficulty === undefined ||
      (difficulty && !DIFFICULTIES.has(difficulty))
    ) {
      errors.push("difficulty must be easy, medium, hard, or empty.");
    } else {
      data.difficulty = difficulty;
    }
  }

  if ("rewardPoints" in body) {
    if (body.rewardPoints === null) {
      data.reward_points = null;
    } else if (
      typeof body.rewardPoints === "number" &&
      Number.isInteger(body.rewardPoints) &&
      body.rewardPoints >= 0
    ) {
      data.reward_points = body.rewardPoints;
    } else {
      errors.push("rewardPoints must be a non-negative integer or null.");
    }
  }

  if ("isActive" in body) {
    if (typeof body.isActive === "boolean") {
      data.is_active = body.isActive;
    } else {
      errors.push("isActive must be a boolean.");
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid trivia question payload.", details: errors };
  }

  return { data };
}

function validateQuestionPatch(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  if (
    typeof body.id !== "number" ||
    !Number.isInteger(body.id) ||
    body.id <= 0
  ) {
    return { error: "id must be a positive integer." };
  }

  const errors: string[] = [];
  const data: Prisma.trivia_questionsUncheckedUpdateInput = {};

  if ("question" in body) {
    if (typeof body.question === "string") {
      const question = body.question.trim();

      if (question.length > 0 && question.length <= 500) {
        data.question = question;
      } else {
        errors.push("question must be 1-500 characters.");
      }
    } else {
      errors.push("question must be a string.");
    }
  }

  if ("answer" in body) {
    if (typeof body.answer === "string") {
      const answer = body.answer.trim();

      if (answer.length > 0 && answer.length <= 200) {
        data.answer = answer;
      } else {
        errors.push("answer must be 1-200 characters.");
      }
    } else {
      errors.push("answer must be a string.");
    }
  }

  if ("category" in body) {
    const category = normalizeOptionalString(body.category);

    if (category === undefined || (category && category.length > 100)) {
      errors.push("category must be 100 characters or fewer.");
    } else {
      data.category = category ?? "General";
    }
  }

  if ("difficulty" in body) {
    const difficulty = normalizeOptionalString(body.difficulty);

    if (
      difficulty === undefined ||
      (difficulty && !DIFFICULTIES.has(difficulty))
    ) {
      errors.push("difficulty must be easy, medium, hard, or empty.");
    } else {
      data.difficulty = difficulty;
    }
  }

  if ("rewardPoints" in body) {
    if (body.rewardPoints === null) {
      data.reward_points = null;
    } else if (
      typeof body.rewardPoints === "number" &&
      Number.isInteger(body.rewardPoints) &&
      body.rewardPoints >= 0
    ) {
      data.reward_points = body.rewardPoints;
    } else {
      errors.push("rewardPoints must be a non-negative integer or null.");
    }
  }

  if ("isActive" in body) {
    if (typeof body.isActive === "boolean") {
      data.is_active = body.isActive;
    } else {
      errors.push("isActive must be a boolean.");
    }
  }

  if (errors.length > 0) {
    return { error: "Invalid trivia question payload.", details: errors };
  }

  if (Object.keys(data).length === 0) {
    return { error: "No supported trivia question fields were provided." };
  }

  return { id: body.id, data };
}

function validateQuestionDelete(body: unknown) {
  if (!isRecord(body)) {
    return { error: "Request body must be a JSON object." };
  }

  if (
    typeof body.id !== "number" ||
    !Number.isInteger(body.id) ||
    body.id <= 0
  ) {
    return { error: "id must be a positive integer." };
  }

  return { id: body.id };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const guildIdBigInt = parseGuildId(guildId);

  if (!guildIdBigInt) {
    return invalidGuildIdResponse();
  }

  const url = new URL(request.url);
  const includeGlobal = url.searchParams.get("includeGlobal") !== "false";
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const search = url.searchParams.get("search")?.trim();
  const category = url.searchParams.get("category")?.trim();
  const difficulty = url.searchParams.get("difficulty")?.trim();
  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const offsetParam = Number(url.searchParams.get("offset") ?? "0");
  const limit =
    Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100)
      : 100;
  const offset =
    Number.isInteger(offsetParam) && offsetParam > 0 ? offsetParam : 0;

  const where: Prisma.trivia_questionsWhereInput = {
    ...(includeGlobal
      ? { OR: [{ guild_id: guildIdBigInt }, { guild_id: null }] }
      : { guild_id: guildIdBigInt }),
    ...(includeInactive ? {} : { is_active: true }),
    ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
    ...(difficulty
      ? { difficulty: { equals: difficulty, mode: "insensitive" } }
      : {}),
    ...(search
      ? {
          OR: [
            { question: { contains: search, mode: "insensitive" } },
            { answer: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const prisma = getPrisma();
    const [questions, total] = await Promise.all([
      prisma.trivia_questions.findMany({
        where,
        orderBy: [{ guild_id: "desc" }, { updated_at: "desc" }, { id: "desc" }],
        take: limit,
        skip: offset,
        select: triviaQuestionSelect,
      }),
      prisma.trivia_questions.count({ where }),
    ]);

    return NextResponse.json({
      questions: questions.map(toQuestionResponse),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to load trivia questions", {
      guildId,
      error,
    });

    return NextResponse.json({
      questions: [],
      total: 0,
      limit,
      offset,
      warnings: ["Trivia questions could not be loaded."],
    });
  }
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

  const validation = validateQuestionCreate(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const question = await prisma.trivia_questions.create({
      data: {
        ...validation.data,
        guild_id: guildIdBigInt,
      },
      select: triviaQuestionSelect,
    });

    return NextResponse.json(
      { question: toQuestionResponse(question) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create trivia question", { guildId, error });

    return NextResponse.json(
      { error: "Failed to create trivia question." },
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

  const validation = validateQuestionPatch(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existingQuestion = await prisma.trivia_questions.findFirst({
      where: {
        id: validation.id,
        guild_id: guildIdBigInt,
      },
      select: { id: true },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Trivia question was not found for this server." },
        { status: 404 }
      );
    }

    const question = await prisma.trivia_questions.update({
      where: { id: validation.id },
      data: validation.data,
      select: triviaQuestionSelect,
    });

    return NextResponse.json({ question: toQuestionResponse(question) });
  } catch (error) {
    console.error("Failed to update trivia question", { guildId, error });

    return NextResponse.json(
      { error: "Failed to update trivia question." },
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

  const validation = validateQuestionDelete(body);

  if ("error" in validation) {
    return NextResponse.json(validation, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existingQuestion = await prisma.trivia_questions.findFirst({
      where: {
        id: validation.id,
        guild_id: guildIdBigInt,
      },
      select: { id: true },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Trivia question was not found for this server." },
        { status: 404 }
      );
    }

    const question = await prisma.trivia_questions.update({
      where: { id: validation.id },
      data: { is_active: false },
      select: triviaQuestionSelect,
    });

    return NextResponse.json({
      question: toQuestionResponse(question),
      deactivated: true,
    });
  } catch (error) {
    console.error("Failed to deactivate trivia question", { guildId, error });

    return NextResponse.json(
      { error: "Failed to deactivate trivia question." },
      { status: 500 }
    );
  }
}
