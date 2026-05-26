import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase middleware utility for Next.js route protection.
 *
 * How to use:
 * -----------
 * Create a file at the root of your project called `middleware.ts`
 * and call `updateSession` from it:
 *
 *   import { updateSession } from "@/src/lib/supabase/middleware";
 *   export async function middleware(request: NextRequest) {
 *     return await updateSession(request);
 *   }
 *   export const config = {
 *     matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
 *   };
 *
 * What it does:
 * -------------
 * - Refreshes the user's auth session on every request so it never
 *   silently expires mid-session.
 * - Redirects unauthenticated users away from protected routes
 *   (configure PROTECTED_ROUTES below).
 * - Passes the refreshed session through to Server Components and
 *   API routes via cookies.
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

/** Routes that require an authenticated session. */
const PROTECTED_ROUTES: string[] = [
  // Add paths here, e.g.:
  // "/dashboard",
  // "/settings",
];

/** Where unauthenticated users are redirected to. */
const LOGIN_ROUTE = "/";

export async function updateSession(request: NextRequest) {
  // Start with a plain response that we'll mutate for cookie writes.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request (for downstream server code)
          // and the response (so the browser receives them).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — IMPORTANT: do not add any logic between
  // createServerClient and getUser() or the session may become stale.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection — redirect unauthenticated users on protected paths.
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_ROUTE;
    redirectUrl.searchParams.set("redirected", "1");
    return NextResponse.redirect(redirectUrl);
  }

  // Must return supabaseResponse (not a plain NextResponse.next()) so
  // the refreshed session cookies are forwarded correctly.
  return supabaseResponse;
}
