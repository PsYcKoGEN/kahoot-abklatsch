"use client";

import { useRouter } from "next/navigation";

export default function AuthorPage() {
  const router = useRouter();

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
          Autor-Bereich
        </h1>

        <p style={{ margin: "0 0 24px 0", color: "#1f2937", fontSize: "18px" }}>
          Hier kommst du zum Quiz-Editor.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push("/")}
            style={{
              display: "inline-block",
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              minWidth: "180px",
              background: "#111827",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Zurück
          </button>

          <button
            onClick={() => router.push("/author/create")}
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
            Neues Quiz erstellen
          </button>
        </div>
      </div>
    </main>
  );
}