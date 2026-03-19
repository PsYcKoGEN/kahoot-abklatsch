"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function PlayerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    const codeFromUrl = (searchParams.get("code") || "").toUpperCase();

    if (codeFromUrl) {
      setCode(codeFromUrl);
    }
  }, [searchParams]);

  function handleJoin() {
    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      alert("Bitte gib deinen Namen ein.");
      return;
    }

    if (!cleanCode) {
      alert("Bitte gib einen Spielcode ein.");
      return;
    }

    router.push(`/lobby/${cleanCode}?name=${encodeURIComponent(cleanName)}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e5e7eb",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          border: "1px solid #d1d5db",
        }}
      >
        <h1 style={{ margin: "0 0 12px 0", fontSize: "30px", color: "#111827" }}>
          Mitspieler
        </h1>

        <p style={{ margin: "0 0 20px 0", color: "#1f2937", fontSize: "18px" }}>
          Namen und Spielcode eingeben.
        </p>

        <input
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "12px",
            borderRadius: "10px",
            border: "2px solid #9ca3af",
            color: "#111827",
            background: "#ffffff",
            fontSize: "16px",
          }}
          placeholder="Dein Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "12px",
            borderRadius: "10px",
            border: "2px solid #9ca3af",
            color: "#111827",
            background: "#ffffff",
            fontSize: "16px",
            textTransform: "uppercase",
          }}
          placeholder="Spielcode"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "8px",
          }}
        >
          <button
            onClick={handleJoin}
            style={{
              display: "inline-block",
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              minWidth: "180px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Beitreten
          </button>

          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "14px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              minWidth: "180px",
              background: "#111827",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Zurück
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Lade...</div>}>
      <PlayerPageContent />
    </Suspense>
  );
}