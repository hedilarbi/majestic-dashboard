import { NextResponse } from "next/server";

export default function proxy(request) {
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;
  const isConnexion = pathname === "/connexion";
  const isGuichet = pathname === "/guichet" || pathname.startsWith("/guichet/");

  if (isConnexion) {
    if (token && role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (token && role === "ticket_office") {
      const url = request.nextUrl.clone();
      url.pathname = "/guichet";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (isGuichet) {
    if (!token || role !== "ticket_office") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/" : "/connexion";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (!token || role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = role === "ticket_office" ? "/guichet" : "/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|api).*)",
  ],
};
