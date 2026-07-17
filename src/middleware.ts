import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/crm", "/dashboard", "/briefings", "/orcamentos"];
const authRoutes = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Check session with Better Auth
  const baseURL = process.env.NODE_ENV === "production" ? "http://127.0.0.1:3000" : request.nextUrl.origin;
  
  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL,
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
