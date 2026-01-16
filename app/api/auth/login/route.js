import { NextResponse } from "next/server";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

export async function POST(request) {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    return Response.json(
      { message: "Configuration serveur manquante." },
      { status: 500 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const email = payload?.email?.trim();
  const password = payload?.password;

  if (!email || !password) {
    return Response.json(
      { message: "Veuillez renseigner l'email et le mot de passe." },
      { status: 400 }
    );
  }

  const apiResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const data = await apiResponse.json().catch(() => ({}));

  if (!apiResponse.ok) {
    const message =
      data?.message === INVALID_CREDENTIALS_MESSAGE
        ? "Email ou mot de passe invalide."
        : "Erreur de connexion.";

    return Response.json({ message }, { status: apiResponse.status });
  }

  if (data?.user?.role !== "admin") {
    return Response.json({ message: "Acces refuse." }, { status: 403 });
  }

  if (!data?.token) {
    return Response.json({ message: "Jeton manquant." }, { status: 500 });
  }

  const response = NextResponse.json({ user: data.user });

  response.cookies.set("auth_token", data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  response.cookies.set("user_role", data.user.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
