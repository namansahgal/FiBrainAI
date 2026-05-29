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

  // Check if brief already exists for this company
  const { data: existingBrief, error: checkError } = await supabase
    .from("financial_briefs")
    .select("company_id")
    .eq("company_id", companyId)
    .limit(1)
    .maybeSingle();

  if (checkError) {
    console.error("[storeBrief] Failed to check for existing brief:", checkError.message);
    return;
  }

  let saveError;
  if (existingBrief) {
    const { error } = await supabase
      .from("financial_briefs")
      .update({
        brief_markdown: brief,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", companyId);
    saveError = error;
  } else {
    const { error } = await supabase
      .from("financial_briefs")
      .insert({
        company_id: companyId,
        brief_markdown: brief,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    saveError = error;
  }

  if (saveError) {
    console.error("[storeBrief] Failed to save brief:", saveError.message);
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
