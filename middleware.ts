import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js Middleware — runs on every matching request at the edge.
 *
 * Responsibilities:
 *  1. Refresh the Supabase auth session cookie so it never silently expires.
 *  2. Protect private routes — redirect unauthenticated visitors to /auth/login.
 *  3. Redirect already-authenticated users away from auth pages to /dashboard.
 */

/** Routes that require a logged-in session */
const PROTECTED = [
  "/dashboard",
  "/onboarding",
  "/brain",
  "/reports",
  "/settings",
];

/** Routes that logged-in users should NOT see (auth pages) */
const AUTH_ROUTES = ["/auth/login", "/auth/signup", "/auth/forgot-password"];

function isProtected(pathname: string): boolean {
  return PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let static assets / Next.js internals / files through immediately
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── Guard: if Supabase env vars are missing, pass everything through ──
  // This prevents a hard 500 on pages that don't need auth while env vars
  // are being configured (e.g. first Vercel deploy before secrets are set).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping auth checks."
    );
    return NextResponse.next();
  }

  // Build a mutable response to carry refreshed session cookies forward
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // getUser() is the only safe way to verify auth in middleware
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── Rule 1: Protected route + no session → send to login ────────────
    if (isProtected(pathname) && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Rule 2: Auth pages + active session → send to dashboard ─────────
    if (isAuthRoute(pathname) && user) {
      const onboardingDone = user.user_metadata?.onboarding_completed === true;
      const dest = request.nextUrl.clone();
      dest.pathname = onboardingDone ? "/dashboard" : "/onboarding";
      dest.search = "";
      return NextResponse.redirect(dest);
    }
  } catch (err) {
    // If Supabase call fails for any reason, log it and pass through
    // so the site keeps working rather than showing a 500.
    console.error("[middleware] Auth check failed:", err);
    return NextResponse.next();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
