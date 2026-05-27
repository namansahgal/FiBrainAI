// ─────────────────────────────────────────────────────────────────────────────
// FiBrainAI — Financial Brief Storage
//
// Saves the brief to Supabase so every AI call
// fetches it from DB instead of regenerating.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function storeBrief(
  companyId: string,
  brief: string
): Promise<void> {
  const supabase = getAdmin();

  await supabase.from("financial_briefs").upsert(
    {
      company_id: companyId,
      brief_markdown: brief,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  );
}

export async function getStoredBrief(
  companyId: string
): Promise<string | null> {
  const supabase = getAdmin();

  const { data } = await supabase
    .from("financial_briefs")
    .select("brief_markdown")
    .eq("company_id", companyId)
    .single();

  return data?.brief_markdown || null;
}
