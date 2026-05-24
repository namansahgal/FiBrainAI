import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "../../../src/lib/supabase/server";

type CoFounderApplication = {
  name: string;
  email: string;
  linkedin: string;
  message: string;
  date: string;
};

type CoFounderApplicationRow = {
  name: string;
  email: string;
  linkedin: string;
  message: string;
  created_at: string;
};

const toApplication = (row: CoFounderApplicationRow): CoFounderApplication => ({
  name: row.name,
  email: row.email,
  linkedin: row.linkedin,
  message: row.message,
  date: new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
});

export async function GET() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ applications: [], configured: false }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from("cofounder_applications")
    .select("name, email, linkedin, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    applications: (data || []).map((row) => toApplication(row as CoFounderApplicationRow)),
    configured: true,
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const linkedin = String(body.linkedin || "").trim();
  const message = String(body.message || "").trim();

  if (!name || !/\S+@\S+\.\S+/.test(email) || !message) {
    return NextResponse.json({ error: "Name, valid email, and message are required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("cofounder_applications")
    .insert({ name, email, linkedin, message })
    .select("name, email, linkedin, message, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: toApplication(data as CoFounderApplicationRow) });
}
