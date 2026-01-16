import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
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
}
