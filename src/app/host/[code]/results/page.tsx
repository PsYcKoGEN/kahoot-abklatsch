"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ActiveSession } from "@/lib/shared/quiz-types";

export default function HostResultsPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || "").toUpperCase();

  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    let stopped = false;

    async function loadSession() {
      const response = await fetch(`/api/session/${code}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        if (!stopped) {
          setSession(null);
        }
        return;
      }

      const data: ActiveSession = await response.json();

      if (!stopped) {
        setSession(data);
      }
    }

    if (!code) return;

    loadSession();
    const interval = setInterval(loadSession, 1000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [code]);

  const leaderboard = useMemo(() => {
    if (!session) return [];
    return [...session.players].sort((a, b) => b.score - a.score);
  }, [session]);

  if (!session) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Ergebnisse nicht gefunden</h1>
          <Link href="/author/create" style={{ ...styles.button, ...styles.secondary }}>
            Zurück
          </Link>
        </div>
      </main>
    );
  }

  const currentSession = session;
  const question = currentSession.quiz.questions[currentSession.currentQuestionIndex];
  const correctAnswerIndexes =
    question?.answers
      .map((answer, index) => (answer.isCorrect ? index : -1))
      .filter((index) => index !== -1) || [];

  async function nextStep() {
    await fetch(`/api/session/${code}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "next" }),
    });

    const isLastQuestion =
      currentSession.currentQuestionIndex >= currentSession.quiz.questions.length - 1;

    if (!isLastQuestion) {
      router.push(`/host/${code}/question`);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          {currentSession.status === "finished"
            ? "Finales Ranking"
            : `Ergebnisse Frage ${currentSession.currentQuestionIndex + 1}`}
        </h1>

        {question ? (
          <>
            <div style={styles.questionBox}>{question.question}</div>

            <div style={styles.answers}>
              {question.answers.map((answer, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.answerItem,
                    background: correctAnswerIndexes.includes(index)
                      ? "#dcfce7"
                      : "#f3f4f6",
                    border: correctAnswerIndexes.includes(index)
                      ? "2px solid #16a34a"
                      : "2px solid #9ca3af",
                  }}
                >
                  {answer.text} {correctAnswerIndexes.includes(index) ? "✓" : ""}
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Ranking</h2>

          {leaderboard.length === 0 ? (
            <p style={styles.text}>Noch keine Spieler vorhanden.</p>
          ) : (
            <ul style={styles.list}>
              {leaderboard.map((player, index) => (
                <li key={`${player.name}-${index}`} style={styles.listItem}>
                  <strong>
                    {index + 1}. {player.name}
                  </strong>{" "}
                  — {player.score} Punkte
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={styles.buttonRow}>
          {currentSession.status !== "finished" ? (
            <button onClick={nextStep} style={{ ...styles.button, ...styles.primary }}>
              {currentSession.currentQuestionIndex >= currentSession.quiz.questions.length - 1
                ? "Quiz beenden"
                : "Nächste Frage"}
            </button>
          ) : null}

          <Link href={`/host/${code}`} style={{ ...styles.button, ...styles.secondary }}>
            Zurück zur Lobby
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e5e7eb",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#111827",
  },
  card: {
    background: "#ffffff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    maxWidth: "800px",
    width: "100%",
    textAlign: "center",
    border: "1px solid #d1d5db",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "32px",
    color: "#111827",
  },
  text: {
    margin: "0 0 14px 0",
    color: "#1f2937",
    fontSize: "18px",
  },
  section: {
    marginTop: "24px",
    textAlign: "left",
  },
  sectionTitle: {
    marginBottom: "12px",
    color: "#111827",
  },
  questionBox: {
    background: "#111827",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    fontSize: "28px",
    margin: "24px 0",
    fontWeight: "bold",
  },
  answers: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
  },
  answerItem: {
    padding: "16px",
    borderRadius: "12px",
    textAlign: "left",
    color: "#111827",
    fontWeight: "bold",
    fontSize: "18px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  listItem: {
    padding: "12px",
    borderRadius: "10px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    color: "#111827",
    fontWeight: "bold",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "24px",
  },
  button: {
    display: "inline-block",
    padding: "14px 18px",
    borderRadius: "10px",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    minWidth: "180px",
    fontWeight: "bold",
  },
  primary: {
    background: "#2563eb",
    color: "#ffffff",
  },
  secondary: {
    background: "#4b5563",
    color: "#ffffff",
  },
};