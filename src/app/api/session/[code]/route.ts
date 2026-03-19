import { getSession } from "@/lib/server/session-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const session = await getSession(code);

  if (!session) {
    return Response.json({ error: "Session nicht gefunden." }, { status: 404 });
  }

  return Response.json(session, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}