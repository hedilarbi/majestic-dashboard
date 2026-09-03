import { NextResponse } from "next/server";

function redirectTo(request, pathname) {
  const forwardedHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;

  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";

  const host = forwardedHost.split(",")[0].trim();
  const protocol = forwardedProto.split(",")[0].trim();

  const url = new URL(pathname, `${protocol}://${host}`);

  return NextResponse.redirect(url);
}

export default function proxy(request) {
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;

  const isConnexion = pathname === "/connexion";

  const isGuichet =
    pathname === "/guichet" ||
    pathname.startsWith("/guichet/");

  const isBlogue =
    pathname === "/blogue" ||
    pathname.startsWith("/blogue/");

  const isCashier =
    pathname === "/caissier" ||
    pathname.startsWith("/caissier/");

  const isDashboardRole =
    role === "admin" ||
    role === "super_admin";

  const isBlogRole =
    role === "blog_manager" ||
    role === "super_admin";

  const isCashierRole = role === "cashier";

  /*
   * Page de connexion
   */
  if (isConnexion) {
    if (token && isDashboardRole) {
      return redirectTo(request, "/");
    }

    if (token && role === "ticket_office") {
      return redirectTo(request, "/guichet");
    }

    if (token && role === "blog_manager") {
      return redirectTo(request, "/blogue");
    }

    if (token && isCashierRole) {
      return redirectTo(request, "/caissier");
    }

    return NextResponse.next();
  }

  /*
   * Espace guichet
   */
  if (isGuichet) {
    if (!token || role !== "ticket_office") {
      const destination = isDashboardRole
        ? "/"
        : "/connexion";

      return redirectTo(request, destination);
    }

    return NextResponse.next();
  }

  /*
   * Espace blogue
   */
  if (isBlogue) {
    if (!token || !isBlogRole) {
      const destination = isDashboardRole
        ? "/"
        : role === "ticket_office"
          ? "/guichet"
          : isCashierRole
            ? "/caissier"
            : "/connexion";

      return redirectTo(request, destination);
    }

    return NextResponse.next();
  }

  /*
   * Espace caissier
   */
  if (isCashier) {
    if (!token || !isCashierRole) {
      const destination = isDashboardRole
        ? "/"
        : role === "ticket_office"
          ? "/guichet"
          : role === "blog_manager"
            ? "/blogue"
            : "/connexion";

      return redirectTo(request, destination);
    }

    return NextResponse.next();
  }

  /*
   * Toutes les autres pages du dashboard
   */
  if (!token || !isDashboardRole) {
    const destination =
      role === "ticket_office"
        ? "/guichet"
        : role === "blog_manager"
          ? "/blogue"
          : isCashierRole
            ? "/caissier"
            : "/connexion";

    return redirectTo(request, destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|api).*)",
  ],
};