"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useParams, useRouter } from "next/navigation";
import { ActiveSession } from "@/lib/shared/quiz-types";

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || "").toUpperCase();

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && code) {
      setJoinUrl(`${window.location.origin}/player?code=${code}`);
    }
  }, [code]);

  useEffect(() => {
    let stopped = false;

    async function loadSession() {
      const response = await fetch(`/api/session/${code}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        if (!stopped) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      const data: ActiveSession = await response.json();

      if (!stopped) {
        setSession(data);
        setLoading(false);
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

  async function resetLobby() {
    await fetch(`/api/session/${code}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "reset" }),
    });
  }

  async function startGame() {
    const response = await fetch(`/api/session/${code}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "start" }),
    });

    if (!response.ok) {
      alert("Spiel konnte nicht gestartet werden.");
      return;
    }

    router.push(`/host/${code}/question`);
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>Lade Lobby...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Lobby nicht gefunden</h1>
          <p style={styles.text}>Für diesen Spielcode gibt es noch keine Session.</p>
          <Link href="/author/create" style={{ ...styles.button, ...styles.primary }}>
            Zurück zum Editor
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Host-Lobby</h1>

        <p style={styles.text}>
          <strong>Quiz:</strong> {session.quiz.title}
        </p>

        <div style={styles.codeBox}>{session.code}</div>

        <p style={styles.text}>Diesen Code gibst du den Mitspielern.</p>

        {joinUrl ? (
          <div style={styles.qrSection}>
            <div style={styles.qrBox}>
              <QRCode
                value={joinUrl}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#111827"
              />
            </div>

            <p style={styles.qrText}>
              QR-Code scannen und direkt mit vorausgefülltem Spielcode beitreten.
            </p>

            <div style={styles.urlBox}>{joinUrl}</div>
          </div>
        ) : null}

        {session.status === "finished" ? (
          <p style={styles.finishedText}>Quiz beendet.</p>
        ) : null}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Mitspieler ({session.players.length})
          </h2>

          {session.players.length === 0 ? (
            <p style={styles.text}>Noch niemand beigetreten.</p>
          ) : (
            <ul style={styles.list}>
              {session.players.map((player, index) => (
                <li key={`${player.name}-${index}`} style={styles.listItem}>
                  {player.name} — {player.score} Punkte
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={styles.buttonRow}>
          <button onClick={startGame} style={{ ...styles.button, ...styles.primary }}>
            Spiel starten
          </button>

          <button onClick={resetLobby} style={{ ...styles.button, ...styles.danger }}>
            Lobby leeren
          </button>

          <Link href={`/host/${code}/results`} style={{ ...styles.button, ...styles.dark }}>
            Ergebnisse ansehen
          </Link>

          <Link href="/author/create" style={{ ...styles.button, ...styles.secondary }}>
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
    maxWidth: "760px",
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
  finishedText: {
    margin: "0 0 18px 0",
    color: "#059669",
    fontWeight: "bold",
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
  qrSection: {
    margin: "24px 0 28px 0",
  },
  qrBox: {
    background: "#ffffff",
    padding: "18px",
    borderRadius: "16px",
    border: "2px solid #d1d5db",
    width: "fit-content",
    margin: "0 auto 14px auto",
  },
  qrText: {
    margin: "0 0 12px 0",
    color: "#111827",
    fontSize: "16px",
    fontWeight: "bold",
  },
  urlBox: {
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px",
    color: "#111827",
    fontSize: "14px",
    wordBreak: "break-all",
  },
  section: {
    marginTop: "28px",
    textAlign: "left",
  },
  sectionTitle: {
    marginBottom: "12px",
    color: "#111827",
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
  danger: {
    background: "#dc2626",
    color: "#ffffff",
  },
  dark: {
    background: "#111827",
    color: "#ffffff",
  },
};