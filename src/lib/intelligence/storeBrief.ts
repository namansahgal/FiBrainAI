// ─────────────────────────────────────────────────────────────────────────────
// FiBrainAI — Financial Brief Storage
//
// Saves the brief to Supabase so every AI call
// fetches it from DB instead of regenerating.
// Uses a singleton admin client for efficiency.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Singleton admin client — created once, reused
let _admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _admin;
}

export async function storeBrief(
  companyId: string,
  brief: string
): Promise<void> {
  const supabase = getAdmin();

  const { error } = await supabase.from("financial_briefs").upsert(
    {
      company_id: companyId,
      brief_markdown: brief,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  );

  if (error) {
    console.error("[storeBrief] Failed to store brief:", error.message);
  }
}

export async function getStoredBrief(
  companyId: string
): Promise<string | null> {
  const supabase = getAdmin();

  const { data, error } = await supabase
    .from("financial_briefs")
    .select("brief_markdown")
    .eq("company_id", companyId)
    .single();

  if (error) {
    console.error("[getStoredBrief] Failed to fetch brief:", error.message);
    return null;
  }

  return data?.brief_markdown || null;
}
