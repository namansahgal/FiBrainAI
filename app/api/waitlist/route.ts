import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "../../../src/lib/supabase/server";

// Valid source values to prevent arbitrary strings being stored
const VALID_SOURCES = ["hero", "cta", "demo", "build-log", "co-founder"] as const;
type WaitlistSource = (typeof VALID_SOURCES)[number];

function sanitizeSource(raw: unknown): WaitlistSource {
  if (typeof raw === "string" && VALID_SOURCES.includes(raw as WaitlistSource)) {
    return raw as WaitlistSource;
  }
  return "hero";
}

export async function GET() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ count: null, configured: false }, { status: 503 });
  }

  const { count, error } = await supabaseAdmin
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count, configured: true });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const source = sanitizeSource(body.source);

  if (!/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("waitlist")
    .upsert({ email, source }, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
