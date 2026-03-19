"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ActiveSession } from "@/lib/shared/quiz-types";

export default function PlayerLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = String(params.code || "").toUpperCase();
  const name = searchParams.get("name") || "";

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [message, setMessage] = useState("Verbinde mit Lobby...");

  useEffect(() => {
    let stopped = false;

    async function joinAndLoad() {
      if (!code || !name.trim()) {
        setMessage("Name oder Spielcode fehlt.");
        return;
      }

      localStorage.setItem(`player-name-${code}`, name.trim());

      const joinResponse = await fetch(`/api/session/${code}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json().catch(() => null);
        setMessage(errorData?.error || "Beitritt zur Lobby fehlgeschlagen.");
        return;
      }

      const sessionData: ActiveSession = await joinResponse.json();

      if (!stopped) {
        setSession(sessionData);

        if (sessionData.status === "question" || sessionData.status === "results") {
          router.push(`/play/${code}`);
          return;
        }

        if (sessionData.status === "finished") {
          setMessage("Das Quiz ist bereits beendet.");
          return;
        }

        setMessage("Du bist der Lobby beigetreten.");
      }
    }

    async function pollSession() {
      const response = await fetch(`/api/session/${code}`, {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data: ActiveSession = await response.json();

      if (!stopped) {
        setSession(data);

        if (data.status === "question" || data.status === "results") {
          router.push(`/play/${code}`);
        }
      }
    }

    joinAndLoad();

    const interval = setInterval(pollSession, 1000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [code, name, router]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Lobby</h1>

        <p style={styles.text}>{message}</p>

        {session ? (
          <>
            <p style={styles.text}>
              <strong>Quiz:</strong> {session.quiz.title}
            </p>

            <div style={styles.codeBox}>{session.code}</div>

            <p style={styles.text}>
              Willkommen, <strong>{name}</strong>
            </p>

            <p style={styles.text}>Warte, bis der Quiz-Autor startet.</p>
          </>
        ) : null}

        <div style={styles.buttonRow}>
          <Link href="/player" style={{ ...styles.button, ...styles.secondary }}>
            Zurück
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
    maxWidth: "700px",
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
  codeBox: {
    fontSize: "42px",
    fontWeight: "bold",
    letterSpacing: "6px",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "20px",
    margin: "20px 0",
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
  secondary: {
    background: "#4b5563",
    color: "#ffffff",
  },
};