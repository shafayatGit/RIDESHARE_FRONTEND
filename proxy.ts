import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionCookie, SESSION_COOKIE } from "@/lib/session";

const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/profile",
  "/find",
  "/offer",
  "/chats",
];

const authRoutes = [
  "/login",
  "/register",
  "/registration",
  "/verify-otp",
  "/otp-verification",
];

const matches = (pathname: string, routes: string[]) =>
  routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSessionCookie(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  const isLoggedIn = Boolean(session);
  const isAdmin = session?.isAdmin === true;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (matches(pathname, protectedRoutes) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (matches(pathname, authRoutes) && isLoggedIn) {
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin" : "/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};