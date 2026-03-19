import { getSession, resetPlayersForGame, saveSession } from "@/lib/server/session-store";
import { ActiveSession } from "@/lib/shared/quiz-types";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const action = String(body?.action || "");

    const session = await getSession(code);

    if (!session) {
      return Response.json({ error: "Session nicht gefunden." }, { status: 404 });
    }

    let updatedSession: ActiveSession | null = null;

    if (action === "reset") {
      updatedSession = {
        ...session,
        status: "lobby",
        players: [],
        currentQuestionIndex: 0,
        questionStartedAt: null,
        answerPhaseStartedAt: null,
      };
    }

    if (action === "start") {
      updatedSession = {
        ...session,
        status: "question",
        players: resetPlayersForGame(session.players),
        currentQuestionIndex: 0,
        questionStartedAt: Date.now(),
        answerPhaseStartedAt: null,
      };
    }

    if (action === "reveal") {
      updatedSession = {
        ...session,
        status: "results",
      };
    }

    if (action === "next") {
      const isLastQuestion =
        session.currentQuestionIndex >= session.quiz.questions.length - 1;

      if (isLastQuestion) {
        updatedSession = {
          ...session,
          status: "finished",
          questionStartedAt: null,
          answerPhaseStartedAt: null,
        };
      } else {
        updatedSession = {
          ...session,
          status: "question",
          currentQuestionIndex: session.currentQuestionIndex + 1,
          questionStartedAt: Date.now(),
          answerPhaseStartedAt: null,
        };
      }
    }

    if (!updatedSession) {
      return Response.json({ error: "Ungültige Aktion." }, { status: 400 });
    }

    await saveSession(updatedSession);

    return Response.json(updatedSession);
  } catch {
    return Response.json(
      { error: "Aktion konnte nicht ausgeführt werden." },
      { status: 500 }
    );
  }
}