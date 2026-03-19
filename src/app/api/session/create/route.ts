import { generateUniqueSessionCode, saveSession, validateQuizData } from "@/lib/server/session-store";
import { ActiveSession, QuizData } from "@/lib/shared/quiz-types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const quiz = body?.quiz as QuizData;

    if (!quiz) {
      return Response.json({ error: "Quiz-Daten fehlen." }, { status: 400 });
    }

    const validationError = validateQuizData(quiz);

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const code = await generateUniqueSessionCode();

    const session: ActiveSession = {
      code,
      status: "lobby",
      quiz,
      players: [],
      currentQuestionIndex: 0,
      questionStartedAt: null,
      answerPhaseStartedAt: null,
      createdAt: new Date().toISOString(),
    };

    await saveSession(session);

    return Response.json(session, { status: 201 });
  } catch {
    return Response.json(
      { error: "Session konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}