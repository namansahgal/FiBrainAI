import { NextResponse } from "next/server";

/**
 * POST /api/parse-statement
 *
 * Accepts a multipart/form-data upload with a bank statement file.
 * Currently returns a mock insight — real parsing (Claude / PDF extraction)
 * will be wired in when the AI layer is built.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const allowedExtensions = [".pdf", ".xls", ".xlsx", ".csv"];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file format. Use PDF, XLS, XLSX, or CSV." },
        { status: 400 }
      );
    }

    // ── Mock response (replace with real parser when AI layer is ready) ──
    // TODO: Pass file to Claude claude-3-5-sonnet for actual extraction
    return NextResponse.json({
      status: "success",
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
      transactions_found: 0,
      insight:
        "I've received your bank statement and it's been queued for analysis. " +
        "Head to your dashboard — your full financial picture will be ready there. " +
        "First report: burn rate breakdown and runway estimate based on your transactions.",
    });
  } catch (err) {
    console.error("[parse-statement]", err);
    return NextResponse.json(
      { error: "Failed to process file." },
      { status: 500 }
    );
  }
}
