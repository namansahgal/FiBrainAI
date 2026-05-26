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

/** Completely public — no auth check needed at all */
const PUBLIC_PREFIXES = [
  "/",           // marketing home (SPA)
  "/auth",       // login / signup pages themselves
  "/_next",      // Next.js internals
  "/favicon",
  "/api",        // API routes handle their own auth
];

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

  // Let non-app paths through immediately (assets, Next internals, API)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Build a mutable response to carry refreshed session cookies forward
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  // getUser() is the only safe way to check auth in middleware
  // (getSession() alone can be spoofed by a tampered cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Rule 1: Protected route + no session → send to login ──────────────
  if (isProtected(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // ── Rule 2: Auth pages + active session → send to dashboard ───────────
  if (isAuthRoute(pathname) && user) {
    const onboardingDone = user.user_metadata?.onboarding_completed === true;
    const dest = request.nextUrl.clone();
    dest.pathname = onboardingDone ? "/dashboard" : "/onboarding";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  // ── Default: pass through with refreshed session cookies ───────────────
  return response;
}

export const config = {
  /*
   * Match all paths EXCEPT:
   *  - _next/static  (static assets)
   *  - _next/image   (Next.js image optimization)
   *  - favicon.ico
   *
   * This intentionally includes /, /auth/*, /dashboard, /api/*, etc.
   * The early-return guards above handle anything we don't want to process.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
