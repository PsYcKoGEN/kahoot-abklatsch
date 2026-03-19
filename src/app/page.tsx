import Link from "next/link";

export default function HomePage() {
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
        <h1 style={{ margin: "0 0 12px 0", fontSize: "32px", color: "#111827" }}>
          Kahoot-Abklatsch
        </h1>

        <p style={{ margin: "0 0 24px 0", color: "#1f2937", fontSize: "18px" }}>
          Wähle aus, wie du die App nutzen möchtest.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/author"
            style={{
              display: "inline-block",
              padding: "14px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              minWidth: "200px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Ich bin Quiz-Autor
          </Link>

          <Link
            href="/player"
            style={{
              display: "inline-block",
              padding: "14px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              minWidth: "200px",
              background: "#111827",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Ich bin Mitspieler
          </Link>
        </div>
      </div>
    </main>
  );
}