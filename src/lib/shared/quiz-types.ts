export const READING_PHASE_MS = 20000;
export const ANSWER_SCORING_WINDOW_MS = 20000;

export type QuestionType = "truefalse" | "single" | "multiple";

export type Answer = {
  text: string;
  isCorrect: boolean;
};

export type Question = {
  type: QuestionType;
  question: string;
  answers: Answer[];
};

export type QuizData = {
  title: string;
  questions: Question[];
  createdAt: string;
};

export type PlayerAnswer = {
  questionIndex: number;
  selectedAnswerIndexes: number[];
  answeredAt: number;
  points: number;
  isCorrect: boolean;
};

export type Player = {
  name: string;
  score: number;
  answers: PlayerAnswer[];
};

export type SessionStatus = "lobby" | "question" | "results" | "finished";

export type ActiveSession = {
  code: string;
  status: SessionStatus;
  quiz: QuizData;
  players: Player[];
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  answerPhaseStartedAt: number | null;
  createdAt: string;
};