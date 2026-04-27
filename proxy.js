import { NextResponse } from "next/server";

export default function proxy(request) {
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;
  const isConnexion = pathname === "/connexion";
  const isGuichet = pathname === "/guichet" || pathname.startsWith("/guichet/");
  const isBlogue = pathname === "/blogue" || pathname.startsWith("/blogue/");
  const isCashier = pathname === "/caissier" || pathname.startsWith("/caissier/");

  const isDashboardRole = role === "admin" || role === "super_admin";
  const isBlogRole = role === "blog_manager" || role === "super_admin";
  const isCashierRole = role === "cashier";

  if (isConnexion) {
    if (token && isDashboardRole) {
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

    if (token && role === "blog_manager") {
      const url = request.nextUrl.clone();
      url.pathname = "/blogue";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (token && isCashierRole) {
      const url = request.nextUrl.clone();
      url.pathname = "/caissier";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (isGuichet) {
    if (!token || role !== "ticket_office") {
      const url = request.nextUrl.clone();
      url.pathname = isDashboardRole ? "/" : "/connexion";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (isBlogue) {
    if (!token || !isBlogRole) {
      const url = request.nextUrl.clone();
      url.pathname = isDashboardRole
        ? "/"
        : role === "ticket_office"
          ? "/guichet"
          : isCashierRole
            ? "/caissier"
          : "/connexion";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (isCashier) {
    if (!token || !isCashierRole) {
      const url = request.nextUrl.clone();
      url.pathname = isDashboardRole
        ? "/"
        : role === "ticket_office"
          ? "/guichet"
          : role === "blog_manager"
            ? "/blogue"
            : "/connexion";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (!token || !isDashboardRole) {
    const url = request.nextUrl.clone();
    url.pathname =
      role === "ticket_office"
        ? "/guichet"
        : role === "blog_manager"
          ? "/blogue"
          : isCashierRole
            ? "/caissier"
          : "/connexion";
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
