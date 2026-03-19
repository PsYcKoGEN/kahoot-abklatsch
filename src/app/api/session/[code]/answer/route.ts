import {
  arraysMatch,
  calculatePoints,
  getCorrectAnswerIndexes,
  getSession,
  sanitizeSelectedAnswerIndexes,
  saveSession,
} from "@/lib/server/session-store";
import { ActiveSession } from "@/lib/shared/quiz-types";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const selectedAnswerIndexes = sanitizeSelectedAnswerIndexes(
      body?.selectedAnswerIndexes
    );

    if (!name) {
      return Response.json({ error: "Name fehlt." }, { status: 400 });
    }

    const session = await getSession(code);

    if (!session) {
      return Response.json({ error: "Session nicht gefunden." }, { status: 404 });
    }

    if (session.status !== "question" || !session.answerPhaseStartedAt) {
      return Response.json(
        { error: "Antwortphase hat noch nicht begonnen." },
        { status: 400 }
      );
    }

    const question = session.quiz.questions[session.currentQuestionIndex];

    if (!question) {
      return Response.json({ error: "Frage nicht gefunden." }, { status: 404 });
    }

    const player = session.players.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (!player) {
      return Response.json({ error: "Spieler nicht gefunden." }, { status: 404 });
    }

    const existingAnswer = player.answers.find(
      (answer) => answer.questionIndex === session.currentQuestionIndex
    );

    if (existingAnswer) {
      return Response.json(
        { error: "Diese Frage wurde bereits beantwortet." },
        { status: 409 }
      );
    }

    if (selectedAnswerIndexes.length === 0) {
      return Response.json(
        { error: "Bitte wähle mindestens eine Antwort aus." },
        { status: 400 }
      );
    }

    const correctAnswerIndexes = getCorrectAnswerIndexes(question);
    const isCorrect = arraysMatch(selectedAnswerIndexes, correctAnswerIndexes);
    const points = calculatePoints(isCorrect, session.answerPhaseStartedAt);

    const updatedSession: ActiveSession = {
      ...session,
      players: session.players.map((item) => {
        if (item.name.toLowerCase() !== name.toLowerCase()) {
          return item;
        }

        return {
          ...item,
          score: item.score + points,
          answers: [
            ...item.answers,
            {
              questionIndex: session.currentQuestionIndex,
              selectedAnswerIndexes,
              answeredAt: Date.now(),
              points,
              isCorrect,
            },
          ],
        };
      }),
    };

    await saveSession(updatedSession);

    return Response.json(updatedSession);
  } catch {
    return Response.json(
      { error: "Antwort konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}