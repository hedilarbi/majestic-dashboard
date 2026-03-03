import { NextResponse } from "next/server";

const expireAuthCookies = (response) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  };

  response.cookies.set("auth_token", "", cookieOptions);
  response.cookies.set("user_role", "", cookieOptions);
  response.cookies.set("user_first_name", "", cookieOptions);
  response.cookies.set("user_last_name", "", cookieOptions);

  return response;
};

const getRedirectUrl = (request, redirectTo) => {
  if (redirectTo && redirectTo.startsWith("/")) {
    return new URL(redirectTo, request.url);
  }

  return new URL("/connexion", request.url);
};

export async function POST() {
  const response = NextResponse.json({ success: true });
  return expireAuthCookies(response);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirect");
  const response = NextResponse.redirect(getRedirectUrl(request, redirectTo));
  return expireAuthCookies(response);
}
