"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Question, QuestionType, QuizData } from "@/lib/shared/quiz-types";

function createSingleQuestion(): Question {
  return {
    type: "single",
    question: "",
    answers: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  };
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([createSingleQuestion()]);
  const [isStarting, setIsStarting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedQuiz = localStorage.getItem("my-quiz");

    if (!savedQuiz) return;

    try {
      const parsedQuiz: QuizData = JSON.parse(savedQuiz);

      if (parsedQuiz.title) {
        setTitle(parsedQuiz.title);
      }

      if (parsedQuiz.questions && parsedQuiz.questions.length > 0) {
        setQuestions(parsedQuiz.questions);
      }
    } catch {
      console.log("Gespeichertes Quiz konnte nicht geladen werden.");
    }
  }, []);

  function getQuizData(): QuizData {
    return {
      title,
      questions,
      createdAt: new Date().toISOString(),
    };
  }

  function addQuestion() {
    if (questions.length >= 20) {
      alert("Maximal 20 Fragen erlaubt.");
      return;
    }

    setQuestions([...questions, createSingleQuestion()]);
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) {
      alert("Mindestens 1 Frage muss bleiben.");
      return;
    }

    const copy = [...questions];
    copy.splice(index, 1);
    setQuestions(copy);
  }

  function updateQuestionText(index: number, value: string) {
    const copy = [...questions];
    copy[index].question = value;
    setQuestions(copy);
  }

  function updateQuestionType(index: number, value: QuestionType) {
    const copy = [...questions];

    if (value === "truefalse") {
      copy[index].type = value;
      copy[index].answers = [
        { text: "Richtig", isCorrect: true },
        { text: "Falsch", isCorrect: false },
      ];
    }

    if (value === "single") {
      copy[index].type = value;
      copy[index].answers = [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ];
    }

    if (value === "multiple") {
      copy[index].type = value;
      copy[index].answers = [
        { text: "", isCorrect: true },
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ];
    }

    setQuestions(copy);
  }

  function updateAnswerText(
    questionIndex: number,
    answerIndex: number,
    value: string
  ) {
    const copy = [...questions];
    copy[questionIndex].answers[answerIndex].text = value;
    setQuestions(copy);
  }

  function toggleCorrect(questionIndex: number, answerIndex: number) {
    const copy = [...questions];
    const question = copy[questionIndex];

    if (question.type === "single" || question.type === "truefalse") {
      question.answers = question.answers.map((answer, index) => ({
        ...answer,
        isCorrect: index === answerIndex,
      }));
    } else {
      question.answers[answerIndex].isCorrect =
        !question.answers[answerIndex].isCorrect;
    }

    setQuestions(copy);
  }

  function saveQuizLocally(showMessage = true) {
    const quizData = getQuizData();
    localStorage.setItem("my-quiz", JSON.stringify(quizData));

    if (showMessage) {
      alert("Quiz lokal gespeichert.");
    }
  }

  function loadQuizLocally() {
    const savedQuiz = localStorage.getItem("my-quiz");

    if (!savedQuiz) {
      alert("Kein lokal gespeichertes Quiz gefunden.");
      return;
    }

    try {
      const parsedQuiz: QuizData = JSON.parse(savedQuiz);
      setTitle(parsedQuiz.title || "");
      setQuestions(
        parsedQuiz.questions && parsedQuiz.questions.length > 0
          ? parsedQuiz.questions
          : [createSingleQuestion()]
      );
      alert("Gespeichertes Quiz geladen.");
    } catch {
      alert("Gespeichertes Quiz konnte nicht geladen werden.");
    }
  }

  function deleteLocalQuiz() {
    localStorage.removeItem("my-quiz");
    alert("Lokales Quiz gelöscht.");
  }

  function exportQuizAsJson() {
    const quizData = getQuizData();
    const jsonString = JSON.stringify(quizData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const safeTitle = title.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "quiz";

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function openImportDialog() {
    fileInputRef.current?.click();
  }

  function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      try {
        const text = readerEvent.target?.result;

        if (typeof text !== "string") {
          alert("Datei konnte nicht gelesen werden.");
          return;
        }

        const parsedQuiz: QuizData = JSON.parse(text);

        if (
          !parsedQuiz ||
          typeof parsedQuiz.title !== "string" ||
          !Array.isArray(parsedQuiz.questions)
        ) {
          alert("Ungültige Quiz-Datei.");
          return;
        }

        setTitle(parsedQuiz.title || "");
        setQuestions(
          parsedQuiz.questions.length > 0
            ? parsedQuiz.questions
            : [createSingleQuestion()]
        );

        localStorage.setItem("my-quiz", JSON.stringify(parsedQuiz));
        alert("Quiz erfolgreich importiert.");
      } catch {
        alert("Die JSON-Datei konnte nicht importiert werden.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  async function startQuiz() {
    const quizData = getQuizData();
    saveQuizLocally(false);
    setIsStarting(true);

    try {
      const response = await fetch("/api/session/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quiz: quizData }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Quiz konnte nicht gestartet werden.");
        return;
      }

      router.push(`/host/${data.code}`);
    } catch {
      alert("Quiz konnte nicht gestartet werden.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
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
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
          border: "1px solid #d1d5db",
        }}
      >
        <h1
          style={{
            margin: "0 0 20px 0",
            fontSize: "32px",
            textAlign: "center",
            color: "#111827",
          }}
        >
          Neues Quiz erstellen
        </h1>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Quiz-Titel
          </label>
          <input
            style={{
              width: "100%",
              padding: "14px",
              border: "2px solid #9ca3af",
              borderRadius: "10px",
              color: "#111827",
              background: "#ffffff",
              fontSize: "16px",
            }}
            type="text"
            placeholder="z. B. Allgemeinwissen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {questions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            style={{
              marginTop: "24px",
              padding: "18px",
              border: "1px solid #cbd5e1",
              borderRadius: "14px",
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, color: "#111827" }}>Frage {questionIndex + 1}</h2>

              <button
                onClick={() => removeQuestion(questionIndex)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: "bold",
                }}
              >
                Frage löschen
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "#111827",
                }}
              >
                Fragetyp
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "2px solid #9ca3af",
                  borderRadius: "10px",
                  color: "#111827",
                  background: "#ffffff",
                  fontSize: "16px",
                }}
                value={question.type}
                onChange={(e) =>
                  updateQuestionType(questionIndex, e.target.value as QuestionType)
                }
              >
                <option value="truefalse">Richtig / Falsch</option>
                <option value="single">Einfachauswahl</option>
                <option value="multiple">Multiple Choice</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "#111827",
                }}
              >
                Frage
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "2px solid #9ca3af",
                  borderRadius: "10px",
                  color: "#111827",
                  background: "#ffffff",
                  fontSize: "16px",
                }}
                type="text"
                placeholder="Frage eingeben"
                value={question.question}
                onChange={(e) => updateQuestionText(questionIndex, e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {question.answers.map((answer, answerIndex) => (
                <div
                  key={answerIndex}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <input
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "2px solid #9ca3af",
                      borderRadius: "10px",
                      color: "#111827",
                      background: "#ffffff",
                      fontSize: "16px",
                    }}
                    type="text"
                    placeholder={`Antwort ${answerIndex + 1}`}
                    value={answer.text}
                    onChange={(e) =>
                      updateAnswerText(questionIndex, answerIndex, e.target.value)
                    }
                    disabled={question.type === "truefalse"}
                  />

                  <label
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                      whiteSpace: "nowrap",
                      color: "#111827",
                      fontWeight: "bold",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={answer.isCorrect}
                      onChange={() => toggleCorrect(questionIndex, answerIndex)}
                    />
                    richtig
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          style={{ display: "none" }}
        />

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "24px",
          }}
        >
          <button
            onClick={addQuestion}
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              minWidth: "180px",
              background: "#374151",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Frage hinzufügen
          </button>

          <button
            onClick={() => saveQuizLocally()}
            style={{
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
            Lokal speichern
          </button>

          <button
            onClick={loadQuizLocally}
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              minWidth: "180px",
              background: "#059669",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Gespeichertes laden
          </button>

          <button
            onClick={exportQuizAsJson}
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              minWidth: "180px",
              background: "#7c3aed",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Als JSON exportieren
          </button>

          <button
            onClick={openImportDialog}
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              minWidth: "180px",
              background: "#d97706",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            JSON importieren
          </button>

          <button
            onClick={deleteLocalQuiz}
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              minWidth: "180px",
              background: "#dc2626",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            Lokales Quiz löschen
          </button>

          <button
            onClick={startQuiz}
            disabled={isStarting}
            style={{
              padding: "14px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: isStarting ? "default" : "pointer",
              minWidth: "180px",
              background: "#111827",
              color: "#ffffff",
              fontWeight: "bold",
              opacity: isStarting ? 0.7 : 1,
            }}
          >
            {isStarting ? "Starte..." : "Quiz starten"}
          </button>

          <Link
            href="/author"
            style={{
              display: "inline-block",
              padding: "14px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              minWidth: "180px",
              background: "#4b5563",
              color: "#ffffff",
              textAlign: "center",
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