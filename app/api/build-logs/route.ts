import { NextResponse } from "next/server";
import { BuildLogEntry } from "../../../src/data";
import { isSupabaseConfigured, supabaseAdmin } from "../../../src/lib/supabase/server";

type BuildLogRow = {
  id: string;
  week: number;
  period: string;
  title: string;
  content: string;
  tags: string[];
};

const toBuildLogEntry = (row: BuildLogRow): BuildLogEntry => ({
  id: row.id,
  week: row.week,
  date: row.period,
  title: row.title,
  content: row.content,
  tags: row.tags || [],
});

export async function GET() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ logs: [], configured: false }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from("build_logs")
    .select("id, week, period, title, content, tags")
    .order("week", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    logs: (data || []).map((row) => toBuildLogEntry(row as BuildLogRow)),
    configured: true,
  });
}

export async function POST(request: Request) {
  // --- Admin key guard ---
  const adminSecret = process.env.ADMIN_SECRET;
  const providedKey = request.headers.get("x-admin-key") ?? "";
  if (!adminSecret || providedKey !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const period = String(body.date || "").trim();
  const week = Number(body.week);
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

  if (!title || !content || !period || !Number.isFinite(week)) {
    return NextResponse.json({ error: "Week, period, title, and content are required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("build_logs")
    .insert({ week, period, title, content, tags })
    .select("id, week, period, title, content, tags")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ log: toBuildLogEntry(data as BuildLogRow) });
}
