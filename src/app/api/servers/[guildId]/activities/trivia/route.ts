import { NextResponse } from "next/server";
import {
  formatBigInt,
  formatDate,
  invalidGuildIdResponse,
  parseGuildId,
} from "@/lib/dashboardApi";
import { logDashboardAction } from "@/lib/dashboardAudit";
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

type TriviaQuestionRecord = {
  id: number;
  guild_id: bigint | null;
  category: string | null;
  question_type: string | null;
  question: string;
  answer: string;
  difficulty: string | null;
  reward_points: number | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
};

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

function toQuestionResponse(question: TriviaQuestionRecord) {
  return {
    id: question.id,
    guildId: formatBigInt(question.guild_id),
    scope: question.guild_id ? "guild" : "global",
    category: question.category?.trim() || "General",
    questionType: question.question_type?.trim() || "open",
    question: question.question,
    answer: question.answer,
    difficulty: question.difficulty?.trim() || null,
    rewardPoints: question.reward_points ?? null,
    isActive: question.is_active ?? true,
    createdAt: formatDate(question.created_at),
    updatedAt: formatDate(question.updated_at),
  };
}

function isKnownSchemaDriftError(error: unknown) {
  if (!isRecord(error)) {
    return false;
  }

  const code = typeof error.code === "string" ? error.code : "";
  const message =
    typeof error.message === "string" ? error.message.toLowerCase() : "";
  const meta = isRecord(error.meta) ? error.meta : {};
  const cause = typeof meta.cause === "string" ? meta.cause.toLowerCase() : "";

  return (
    code === "P2021" ||
    code === "P2022" ||
    message.includes("does not exist") ||
    message.includes("column") ||
    cause.includes("does not exist") ||
    cause.includes("column")
  );
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

  const andFilters: Prisma.trivia_questionsWhereInput[] = [
    includeGlobal
      ? { OR: [{ guild_id: guildIdBigInt }, { guild_id: null }] }
      : { guild_id: guildIdBigInt },
  ];

  if (!includeInactive) {
    andFilters.push({ is_active: true });
  }

  if (category) {
    andFilters.push({ category: { equals: category, mode: "insensitive" } });
  }

  if (difficulty) {
    andFilters.push({
      difficulty: { equals: difficulty, mode: "insensitive" },
    });
  }

  if (search) {
    andFilters.push({
      OR: [
        { question: { contains: search, mode: "insensitive" } },
        { answer: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.trivia_questionsWhereInput = { AND: andFilters };

  try {
    const prisma = getPrisma();
    let questions: TriviaQuestionRecord[];
    let total = 0;

    try {
      [questions, total] = await Promise.all([
        prisma.trivia_questions.findMany({
          where,
          orderBy: [
            { guild_id: "desc" },
            { updated_at: "desc" },
            { id: "desc" },
          ],
          take: limit,
          skip: offset,
          select: triviaQuestionSelect,
        }),
        prisma.trivia_questions.count({ where }),
      ]);
    } catch (queryError) {
      if (!isKnownSchemaDriftError(queryError)) {
        throw queryError;
      }

      console.error(
        "Trivia question management columns are missing; falling back to legacy global trivia_questions read",
        {
          guildId,
          error: queryError,
        }
      );

      if (!includeGlobal) {
        questions = [];
        total = 0;
      } else {
        const legacyQuestions = await prisma.trivia_questions.findMany({
          where: {
            ...(category
              ? { category: { equals: category, mode: "insensitive" } }
              : {}),
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
          },
          orderBy: { id: "desc" },
          take: limit,
          skip: offset,
          select: {
            id: true,
            category: true,
            question_type: true,
            question: true,
            answer: true,
            difficulty: true,
          },
        });
        total = await prisma.trivia_questions.count({
          where: {
            ...(category
              ? { category: { equals: category, mode: "insensitive" } }
              : {}),
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
          },
        });
        questions = legacyQuestions.map((question) => ({
          ...question,
          guild_id: null,
          reward_points: null,
          is_active: true,
          created_at: null,
          updated_at: null,
        }));
      }
    }

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

    return NextResponse.json(
      {
        questions: [],
        total: 0,
        limit,
        offset,
        error: "Trivia questions could not be loaded.",
      },
      { status: 500 }
    );
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

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType: question.is_active ? "CREATE" : "DISABLE",
      entityType: "TRIVIA_QUESTION",
      entityId: question.id,
      summary: `Created trivia question "${question.question}"`,
      metadata: {
        category: question.category,
        difficulty: question.difficulty,
        rewardPoints: question.reward_points,
      },
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

    const actionType =
      typeof validation.data.is_active === "boolean"
        ? validation.data.is_active
          ? "ENABLE"
          : "DISABLE"
        : "UPDATE";

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType,
      entityType: "TRIVIA_QUESTION",
      entityId: question.id,
      summary:
        actionType === "ENABLE"
          ? `Enabled trivia question #${question.id}`
          : actionType === "DISABLE"
            ? `Disabled trivia question #${question.id}`
            : `Updated trivia question #${question.id}`,
      metadata: { fields: Object.keys(validation.data) },
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

    await logDashboardAction({
      guildId: guildIdBigInt,
      actionType: "DELETE",
      entityType: "TRIVIA_QUESTION",
      entityId: question.id,
      summary: `Deactivated trivia question #${question.id}`,
      metadata: { softDelete: true, question: question.question },
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
