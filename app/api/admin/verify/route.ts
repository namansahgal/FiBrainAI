import { NextResponse } from "next/server";

// POST /api/admin/verify
// Body: { key: string }
// Returns: { ok: true } or 401
export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Admin secret not configured on server." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "").trim();

  if (!key || key !== adminSecret) {
    // Intentionally vague — don't leak whether the secret exists
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
