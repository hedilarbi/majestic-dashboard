import { toggleUserStatus } from "@/services/users";

export async function POST(_req, { params }) {
  const { userId } = await params;

  if (!userId) {
    return Response.json({ ok: false, message: "userId manquant." }, { status: 400 });
  }

  const result = await toggleUserStatus(userId);

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
