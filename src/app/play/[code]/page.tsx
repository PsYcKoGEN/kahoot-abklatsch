"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ActiveSession, READING_PHASE_MS } from "@/lib/shared/quiz-types";

export default function PlayPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [selectedAnswerIndexes, setSelectedAnswerIndexes] = useState<number[]>([]);
  const [message, setMessage] = useState("Frage wird geladen...");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let stopped = false;
    const savedPlayerName = localStorage.getItem(`player-name-${code}`) || "";
    setPlayerName(savedPlayerName);

    async function loadSession() {
      const response = await fetch(`/api/session/${code}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        if (!stopped) {
          setSession(null);
          setMessage("Session nicht gefunden.");
        }
        return;
      }

      const data: ActiveSession = await response.json();

      if (!stopped) {
        setSession(data);

        if (data.status === "finished") {
          setMessage("Das Quiz ist beendet.");
        } else {
          setMessage("");
        }
      }
    }

    if (!code) return;

    loadSession();

    const interval = setInterval(() => {
      setNow(Date.now());
      loadSession();
    }, 500);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [code]);

  const currentQuestionIndex = session?.currentQuestionIndex ?? 0;
  const currentQuestion = session?.quiz.questions[currentQuestionIndex];

  const currentPlayer = useMemo(() => {
    if (!session || !playerName) return null;

    return (
      session.players.find(
        (player) => player.name.toLowerCase() === playerName.toLowerCase()
      ) || null
    );
  }, [session, playerName]);

  const existingAnswer = currentPlayer?.answers.find(
    (answer) => answer.questionIndex === currentQuestionIndex
  );

  const leaderboard = useMemo(() => {
    if (!session) return [];
    return [...session.players].sort((a, b) => b.score - a.score);
  }, [session]);

  useEffect(() => {
    if (existingAnswer) {
      setSelectedAnswerIndexes(existingAnswer.selectedAnswerIndexes);
    } else {
      setSelectedAnswerIndexes([]);
    }
  }, [currentQuestionIndex, existingAnswer]);

  const answersVisible = !!session?.answerPhaseStartedAt;

  const remainingReadingSeconds =
    session?.questionStartedAt && !session.answerPhaseStartedAt
      ? Math.max(
          0,
          Math.ceil((READING_PHASE_MS - (now - session.questionStartedAt)) / 1000)
        )
      : 0;

  function handleAnswerClick(answerIndex: number) {
    if (!currentQuestion || existingAnswer || session?.status !== "question") return;
    if (!answersVisible) return;

    if (currentQuestion.type === "multiple") {
      setSelectedAnswerIndexes((prev) =>
        prev.includes(answerIndex)
          ? prev.filter((index) => index !== answerIndex)
          : [...prev, answerIndex]
      );
      return;
    }

    setSelectedAnswerIndexes([answerIndex]);
  }

  async function submitAnswer() {
    if (!session || !currentPlayer || !currentQuestion) return;

    const response = await fetch(`/api/session/${code}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: currentPlayer.name,
        selectedAnswerIndexes,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      alert(data?.error || "Antwort konnte nicht gespeichert werden.");
      return;
    }

    setSession(data);
  }

  if (!session) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Spiel nicht gefunden</h1>
          <p style={styles.text}>{message}</p>
          <Link href="/player" style={{ ...styles.button, ...styles.secondary }}>
            Zurück
          </Link>
        </div>
      </main>
    );
  }

  if (session.status === "finished") {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Quiz beendet</h1>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Finales Ranking</h2>

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
          </div>

          <Link href="/player" style={{ ...styles.button, ...styles.secondary }}>
            Zurück
          </Link>
        </div>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Keine Frage gefunden</h1>
        </div>
      </main>
    );
  }

  if (session.status === "results") {
    const correctAnswerIndexes = currentQuestion.answers
      .map((answer, index) => (answer.isCorrect ? index : -1))
      .filter((index) => index !== -1);

    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Ergebnisse</h1>

          <div style={styles.questionBox}>{currentQuestion.question}</div>

          <div style={styles.answers}>
            {currentQuestion.answers.map((answer, index) => (
              <div
                key={index}
                style={{
                  ...styles.answerResult,
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

          {existingAnswer ? (
            <p style={styles.successText}>
              Deine Punkte für diese Frage: {existingAnswer.points}
            </p>
          ) : (
            <p style={styles.text}>Du hast diese Frage nicht beantwortet.</p>
          )}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Aktuelles Ranking</h2>

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
          </div>

          <p style={styles.text}>Warte auf die nächste Frage.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Frage {currentQuestionIndex + 1}</h1>

        <p style={styles.text}>
          <strong>{session.quiz.title}</strong>
        </p>

        <p style={styles.text}>
          Spieler: <strong>{playerName}</strong>
        </p>

        <div style={styles.questionBox}>{currentQuestion.question}</div>

        {!answersVisible ? (
          <div style={styles.readingBox}>
            <div style={styles.readingTitle}>Frage lesen</div>
            <div style={styles.readingTimer}>{remainingReadingSeconds}</div>
            <div style={styles.readingText}>
              Die Antworten erscheinen gleich automatisch.
            </div>
          </div>
        ) : (
          <>
            <div style={styles.answers}>
              {currentQuestion.answers.map((answer, index) => {
                const selected = selectedAnswerIndexes.includes(index);

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(index)}
                    disabled={!!existingAnswer}
                    style={{
                      ...styles.answerButton,
                      background: selected ? "#2563eb" : "#f3f4f6",
                      color: selected ? "#ffffff" : "#111827",
                      border: selected ? "2px solid #1d4ed8" : "2px solid #9ca3af",
                      cursor: existingAnswer ? "default" : "pointer",
                    }}
                  >
                    {answer.text}
                  </button>
                );
              })}
            </div>

            {currentQuestion.type === "multiple" ? (
              <p style={styles.text}>Mehrere Antworten möglich.</p>
            ) : null}

            {existingAnswer ? (
              <p style={styles.successText}>Antwort gespeichert. Warte auf die Auswertung.</p>
            ) : (
              <button onClick={submitAnswer} style={{ ...styles.button, ...styles.primary }}>
                Antwort abschicken
              </button>
            )}
          </>
        )}
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
  successText: {
    marginTop: "16px",
    color: "#059669",
    fontWeight: "bold",
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
    fontSize: "30px",
    margin: "24px 0",
    fontWeight: "bold",
    lineHeight: 1.4,
  },
  readingBox: {
    background: "#f3f4f6",
    border: "2px solid #9ca3af",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "24px",
  },
  readingTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "12px",
  },
  readingTimer: {
    fontSize: "56px",
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: "12px",
  },
  readingText: {
    fontSize: "18px",
    color: "#111827",
    fontWeight: "bold",
  },
  answers: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
  },
  answerButton: {
    padding: "16px",
    borderRadius: "12px",
    textAlign: "left",
    fontSize: "18px",
    fontWeight: "bold",
  },
  answerResult: {
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