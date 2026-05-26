import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Uses the public anon key — safe to expose in the browser.
 * For server-side operations that require elevated privileges,
 * use the service-role client in src/lib/supabase/server.ts instead.
 *
 * Required environment variables (must be prefixed NEXT_PUBLIC_ so
 * Next.js exposes them to the client bundle):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
