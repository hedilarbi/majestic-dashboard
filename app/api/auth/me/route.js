import { NextResponse } from "next/server";

const clearAuthCookies = (response) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };

  response.cookies.set("auth_token", "", cookieOptions);
  response.cookies.set("user_role", "", cookieOptions);
};

export async function GET(request) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const response = NextResponse.json(
      { message: "Non authentifie." },
      { status: 401 }
    );
    clearAuthCookies(response);
    return response;
  }

  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { message: "Configuration serveur manquante." },
      { status: 500 }
    );
  }

  const apiResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/staff/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await apiResponse.json().catch(() => ({}));

  if (!apiResponse.ok) {
    const response = NextResponse.json(
      { message: data?.message || "Erreur de connexion." },
      { status: apiResponse.status }
    );

    if (apiResponse.status === 401 || apiResponse.status === 403) {
      clearAuthCookies(response);
    }

    return response;
  }

  if (data?.user?.role !== "admin") {
    const response = NextResponse.json(
      { message: "Acces refuse." },
      { status: 403 }
    );
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({ user: data.user });

  response.cookies.set("user_role", data.user.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
