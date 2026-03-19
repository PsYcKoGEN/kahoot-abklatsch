import {
  ActiveSession,
  ANSWER_SCORING_WINDOW_MS,
  Player,
  Question,
  QuizData,
  READING_PHASE_MS,
} from "@/lib/shared/quiz-types";
import { redis } from "@/lib/server/redis";

const SESSION_PREFIX = "kahoot-abklatsch:session:";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const ANSWER_POINTS_BUFFER_MS = 2000;

function sessionKey(code: string) {
  return `${SESSION_PREFIX}${code}`;
}

export async function saveSession(session: ActiveSession) {
  await redis.set(sessionKey(session.code), session, {
    ex: SESSION_TTL_SECONDS,
  });

  return session;
}

export async function getSession(code: string) {
  const session = await redis.get<ActiveSession>(sessionKey(code.toUpperCase()));

  if (!session) {
    return null;
  }

  return await normalizeSession(session);
}

export async function generateUniqueSessionCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const existing = await redis.get(sessionKey(code));

    if (!existing) {
      return code;
    }
  }

  throw new Error("Konnte keinen eindeutigen Spielcode erzeugen.");
}

export async function normalizeSession(session: ActiveSession) {
  if (
    session.status === "question" &&
    session.questionStartedAt &&
    !session.answerPhaseStartedAt
  ) {
    const answerPhaseStartedAt = session.questionStartedAt + READING_PHASE_MS;

    if (Date.now() >= answerPhaseStartedAt) {
      const updatedSession: ActiveSession = {
        ...session,
        answerPhaseStartedAt,
      };

      await saveSession(updatedSession);
      return updatedSession;
    }
  }

  return session;
}

export function getCorrectAnswerIndexes(question: Question) {
  return question.answers
    .map((answer, index) => (answer.isCorrect ? index : -1))
    .filter((index) => index !== -1);
}

export function arraysMatch(a: number[], b: number[]) {
  if (a.length !== b.length) {
    return false;
  }

  const aSorted = [...a].sort((x, y) => x - y);
  const bSorted = [...b].sort((x, y) => x - y);

  return aSorted.every((value, index) => value === bSorted[index]);
}

export function calculatePoints(
  isCorrect: boolean,
  answerPhaseStartedAt: number | null
) {
  if (!isCorrect || !answerPhaseStartedAt) {
    return 0;
  }

  const elapsedMs = Math.max(0, Date.now() - answerPhaseStartedAt);

  if (elapsedMs <= ANSWER_POINTS_BUFFER_MS) {
    return 1000;
  }

  const adjustedElapsedMs = elapsedMs - ANSWER_POINTS_BUFFER_MS;
  const speedRatio = Math.max(
    0,
    1 - Math.min(adjustedElapsedMs, ANSWER_SCORING_WINDOW_MS) / ANSWER_SCORING_WINDOW_MS
  );

  return Math.round(1000 * speedRatio);
}

export function sanitizeSelectedAnswerIndexes(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item) => Number.isInteger(item) && item >= 0))];
}

export function validateQuizData(quiz: QuizData) {
  if (!quiz.title?.trim()) {
    return "Bitte gib einen Quiz-Titel ein.";
  }

  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return "Bitte lege mindestens eine Frage an.";
  }

  for (const question of quiz.questions) {
    if (!question.question?.trim()) {
      return "Bitte fülle alle Fragen aus.";
    }

    if (!Array.isArray(question.answers) || question.answers.length === 0) {
      return "Jede Frage braucht Antworten.";
    }

    if (question.answers.some((answer) => !answer.text?.trim())) {
      return "Bitte fülle alle Antworten aus.";
    }

    if (!question.answers.some((answer) => answer.isCorrect)) {
      return "Jede Frage braucht mindestens eine richtige Antwort.";
    }
  }

  return null;
}

export function resetPlayersForGame(players: Player[]) {
  return players.map((player) => ({
    ...player,
    score: 0,
    answers: [],
  }));
}