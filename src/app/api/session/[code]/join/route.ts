import { getSession, saveSession } from "@/lib/server/session-store";
import { ActiveSession } from "@/lib/shared/quiz-types";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return Response.json({ error: "Name fehlt." }, { status: 400 });
    }

    const session = await getSession(code);

    if (!session) {
      return Response.json({ error: "Session nicht gefunden." }, { status: 404 });
    }

    const alreadyExists = session.players.some(
      (player) => player.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      return Response.json(session);
    }

    const updatedSession: ActiveSession = {
      ...session,
      players: [
        ...session.players,
        {
          name,
          score: 0,
          answers: [],
        },
      ],
    };

    await saveSession(updatedSession);

    return Response.json(updatedSession);
  } catch {
    return Response.json(
      { error: "Beitritt zur Lobby fehlgeschlagen." },
      { status: 500 }
    );
  }
}