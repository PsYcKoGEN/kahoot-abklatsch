"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ActiveSession, READING_PHASE_MS } from "@/lib/shared/quiz-types";

export default function HostQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || "").toUpperCase();

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [now, setNow] = useState(Date.now());

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

        if (data.status === "results") {
          router.push(`/host/${code}/results`);
        }

        if (data.status === "finished") {
          router.push(`/host/${code}/results`);
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
  }, [code, router]);

  if (!session) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Session nicht gefunden</h1>
          <Link href="/author/create" style={{ ...styles.button, ...styles.secondary }}>
            Zurück
          </Link>
        </div>
      </main>
    );
  }

  const question = session.quiz.questions[session.currentQuestionIndex];

  if (!question) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Keine Frage gefunden</h1>
          <Link href={`/host/${code}`} style={{ ...styles.button, ...styles.secondary }}>
            Zurück
          </Link>
        </div>
      </main>
    );
  }

  const answersVisible = !!session.answerPhaseStartedAt;

  const remainingReadingSeconds =
    session.questionStartedAt && !session.answerPhaseStartedAt
      ? Math.max(
          0,
          Math.ceil((READING_PHASE_MS - (now - session.questionStartedAt)) / 1000)
        )
      : 0;

  const answeredCount = session.players.filter((player) =>
    player.answers.some(
      (answer) => answer.questionIndex === session.currentQuestionIndex
    )
  ).length;

  async function showResults() {
    await fetch(`/api/session/${code}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "reveal" }),
    });

    router.push(`/host/${code}/results`);
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Frage {session.currentQuestionIndex + 1}</h1>

        <p style={styles.text}>
          <strong>Quiz:</strong> {session.quiz.title}
        </p>

        <div style={styles.questionBox}>{question.question}</div>

        {!answersVisible ? (
          <div style={styles.readingBox}>
            <div style={styles.readingTitle}>Nur Lesephase</div>
            <div style={styles.readingTimer}>{remainingReadingSeconds}</div>
            <div style={styles.readingText}>
              Die Antworten erscheinen automatisch nach {READING_PHASE_MS / 1000} Sekunden.
            </div>
          </div>
        ) : (
          <>
            <div style={styles.answers}>
              {question.answers.map((answer, index) => (
                <div key={index} style={styles.answerItem}>
                  {answer.text}
                </div>
              ))}
            </div>

            <p style={styles.text}>
              Geantwortet: <strong>{answeredCount}</strong> / {session.players.length}
            </p>

            <p style={styles.noticeText}>
              Jetzt läuft die Punktevergabe gleichmäßig von 1000 bis 0 über 20 Sekunden.
            </p>
          </>
        )}

        <div style={styles.buttonRow}>
          {answersVisible ? (
            <button onClick={showResults} style={{ ...styles.button, ...styles.primary }}>
              Ergebnisse anzeigen
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
  questionBox: {
    background: "#111827",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    fontSize: "30px",
    fontWeight: "bold",
    margin: "24px 0",
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
  answerItem: {
    padding: "16px",
    borderRadius: "12px",
    background: "#f3f4f6",
    border: "2px solid #9ca3af",
    textAlign: "left",
    color: "#111827",
    fontWeight: "bold",
    fontSize: "18px",
  },
  noticeText: {
    color: "#1d4ed8",
    fontWeight: "bold",
    fontSize: "18px",
    marginBottom: "16px",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
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