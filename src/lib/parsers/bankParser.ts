/**
 * src/lib/parsers/bankParser.ts
 *
 * Parses Indian bank statement files (CSV, XLSX, XLS, PDF) into
 * a normalised list of transactions.
 *
 * Runs server-side only — imported exclusively by Next.js API routes.
 */

import { categorize, detectRecurring } from "./categorizer";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ParsedTransaction = {
  date: string; // YYYY-MM-DD
  description: string; // cleaned narration
  rawDescription: string; // original text from file
  amount: number; // always positive
  type: "debit" | "credit";
  category: string;
  isRecurring: boolean;
  isSalary: boolean;
  confidence: number;
};

export type ParseResult = {
  transactions: ParsedTransaction[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    salaryDetected: boolean;
    salaryAmount: number;
    dateRange: { from: string; to: string };
    bankDetected: string;
    transactionCount: number;
  };
  error?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Column detection helpers
// ─────────────────────────────────────────────────────────────────────────────

type ColMap = {
  dateCol: number;
  descCol: number;
  debitCol: number;
  creditCol: number;
  amountCol: number; // single-column fallback
  balanceCol: number;
};

const HEADER_KEYWORDS = [
  "date", "transaction", "amount", "debit", "credit",
  "balance", "narration", "particulars", "description",
  "withdrawal", "deposit", "remarks",
];

function findHeaderRow(rows: (string | number)[][]): number {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const rowStr = rows[i].join(" ").toLowerCase();
    const hits = HEADER_KEYWORDS.filter((kw) => rowStr.includes(kw)).length;
    if (hits >= 2) return i;
  }
  return -1;
}

function detectColumns(headerRow: (string | number)[]): ColMap {
  const map: ColMap = {
    dateCol: -1, descCol: -1,
    debitCol: -1, creditCol: -1,
    amountCol: -1, balanceCol: -1,
  };

  headerRow.forEach((cell, idx) => {
    const h = String(cell).toLowerCase().trim();

    if (map.dateCol === -1 && (
      h.includes("date") || h === "txn dt" || h === "value dt"
    )) map.dateCol = idx;

    if (map.descCol === -1 && (
      h.includes("description") || h.includes("narration") ||
      h.includes("particulars") || h.includes("remarks") ||
      h.includes("transaction details") || h.includes("txn remarks")
    )) map.descCol = idx;

    if (map.debitCol === -1 && (
      h.includes("debit") || h.includes("withdrawal") ||
      h === "dr" || h === "dr amount" || h === "debit amt"
    )) map.debitCol = idx;

    if (map.creditCol === -1 && (
      h.includes("credit") || h.includes("deposit") ||
      h === "cr" || h === "cr amount" || h === "credit amt"
    )) map.creditCol = idx;

    if (map.amountCol === -1 && h === "amount") map.amountCol = idx;

    if (map.balanceCol === -1 && h.includes("balance")) map.balanceCol = idx;
  });

  return map;
}

function detectBank(headerRow: (string | number)[]): string {
  const h = headerRow.map((c) => String(c).toLowerCase()).join(" ");
  if (h.includes("narration") && h.includes("chq") && h.includes("value dt")) return "HDFC Bank";
  if (h.includes("value date") && h.includes("ref no")) return "ICICI Bank";
  if (h.includes("tran date") && (h.includes("dr") || h.includes("cr"))) return "Axis Bank";
  if (h.includes("particulars") && h.includes("cheque")) return "SBI";
  if (h.includes("transaction remarks") && h.includes("debit amount")) return "Kotak Bank";
  return "Unknown Bank";
}

// ─────────────────────────────────────────────────────────────────────────────
// Date parsing
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04",
  may: "05", jun: "06", jul: "07", aug: "08",
  sep: "09", oct: "10", nov: "11", dec: "12",
};

function parseDate(val: string | number | undefined): string {
  const today = new Date().toISOString().slice(0, 10);
  if (val == null || val === "") return today;

  // Excel serial number
  if (typeof val === "number" && val > 20000) {
    try {
      // Excel epoch is 1900-01-01; JS epoch is 1970-01-01
      // Days since 1900-01-01 to 1970-01-01 = 25569
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString().slice(0, 10);
    } catch {
      return today;
    }
  }

  const str = String(val).trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD MMM YYYY (e.g. "15 May 2026")
  const dmmy = str.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dmmy) {
    const [, d, mon, y] = dmmy;
    const m = MONTH_MAP[mon.toLowerCase()] ?? "01";
    return `${y}-${m}-${d.padStart(2, "0")}`;
  }

  // Fallback: try JS Date constructor
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return today;
}

// ─────────────────────────────────────────────────────────────────────────────
// Amount parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseAmount(val: string | number | undefined): number | null {
  if (val == null || val === "") return null;
  const cleaned = String(val)
    .replace(/[₹,\s]/g, "")
    .replace(/Rs\.?/gi, "")
    .replace(/INR/gi, "")
    .trim();
  if (!cleaned || cleaned === "-" || cleaned === "--") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : Math.abs(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Row → transaction conversion
// ─────────────────────────────────────────────────────────────────────────────

function rowsToTransactions(
  rows: (string | number)[][],
  cols: ColMap
): Omit<ParsedTransaction, "isRecurring">[] {
  const results: Omit<ParsedTransaction, "isRecurring">[] = [];

  for (const row of rows) {
    if (!row || row.length === 0) continue;

    const rawDesc = String(row[cols.descCol] ?? "").trim();
    const dateStr = parseDate(row[cols.dateCol]);

    // Skip rows that look like headers or totals
    if (
      rawDesc.toLowerCase().includes("opening balance") ||
      rawDesc.toLowerCase().includes("closing balance") ||
      rawDesc === ""
    ) continue;

    let amount: number | null = null;
    let type: "debit" | "credit" | null = null;

    if (cols.debitCol !== -1 || cols.creditCol !== -1) {
      // Separate debit/credit columns
      const debitAmt = parseAmount(row[cols.debitCol]);
      const creditAmt = parseAmount(row[cols.creditCol]);

      if (debitAmt && debitAmt > 0) { amount = debitAmt; type = "debit"; }
      else if (creditAmt && creditAmt > 0) { amount = creditAmt; type = "credit"; }
      else continue;
    } else if (cols.amountCol !== -1) {
      // Single amount column: negative = debit, positive = credit
      const raw = String(row[cols.amountCol] ?? "").trim();
      const isNeg = raw.startsWith("-") || raw.startsWith("(");
      const n = parseAmount(raw);
      if (!n || n === 0) continue;
      amount = n;
      type = isNeg ? "debit" : "credit";
    } else {
      continue;
    }

    if (!amount || amount === 0) continue;

    const desc = cleanDescription(rawDesc);
    const { category, confidence } = categorize(desc, type, amount);
    const isSalary =
      type === "credit" &&
      (category === "Salaries" || (desc.toUpperCase().includes("SALARY") && amount >= 15000));

    results.push({
      date: dateStr,
      description: desc,
      rawDescription: rawDesc,
      amount,
      type,
      category,
      isSalary,
      confidence,
    });
  }

  return results;
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/[|\/\\]+/g, " ") // strip pipe/slash separators
    .replace(/\s{2,}/g, " ")   // collapse whitespace
    .trim()
    .slice(0, 120);             // cap length
}

// ─────────────────────────────────────────────────────────────────────────────
// Format-specific parsers
// ─────────────────────────────────────────────────────────────────────────────

async function parseCSV(file: File): Promise<(string | number)[][]> {
  const Papa = (await import("papaparse")).default;
  const text = await file.text();
  const result = Papa.parse<(string | number)[]>(text, {
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return result.data;
}

async function parseExcel(file: File): Promise<(string | number)[][]> {
  const XLSX = await import("xlsx");
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });
}

async function parsePDF(file: File): Promise<(string | number)[][]> {
  // Dynamic import to avoid SSR/bundle issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMod = await import("pdf-parse" as any);
  const pdfParse = pdfMod.default ?? pdfMod;
  const buffer = Buffer.from(await file.arrayBuffer());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: { text: string } = await pdfParse(buffer);

  // Split text into lines, then split each line into cells by 2+ spaces or tabs
  const rows = (data.text as string)
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .map((line: string) => line.split(/\s{2,}|\t/));

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary computation
// ─────────────────────────────────────────────────────────────────────────────

function computeSummary(
  transactions: ParsedTransaction[],
  bankDetected: string
): ParseResult["summary"] {
  const debits = transactions.filter((t) => t.type === "debit");
  const credits = transactions.filter((t) => t.type === "credit");

  const totalDebits = debits.reduce((s, t) => s + t.amount, 0);
  const totalCredits = credits.reduce((s, t) => s + t.amount, 0);

  const salaryTxns = transactions.filter((t) => t.isSalary);
  const salaryAmount = salaryTxns.reduce((s, t) => s + t.amount, 0);

  const dates = transactions.map((t) => t.date).sort();
  const from = dates[0] ?? new Date().toISOString().slice(0, 10);
  const to = dates[dates.length - 1] ?? from;

  return {
    totalDebits,
    totalCredits,
    salaryDetected: salaryTxns.length > 0,
    salaryAmount,
    dateRange: { from, to },
    bankDetected,
    transactionCount: transactions.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a bank statement file into normalised transactions.
 *
 * @param file - Web API File from multipart form upload
 */
export async function parseStatement(file: File): Promise<ParseResult> {
  const empty: ParseResult = {
    transactions: [],
    summary: {
      totalDebits: 0,
      totalCredits: 0,
      salaryDetected: false,
      salaryAmount: 0,
      dateRange: { from: "", to: "" },
      bankDetected: "Unknown Bank",
      transactionCount: 0,
    },
  };

  const ext = file.name.toLowerCase().split(".").pop() ?? "";

  let rawRows: (string | number)[][] = [];
  try {
    if (ext === "pdf") {
      rawRows = await parsePDF(file);
    } else if (ext === "xls" || ext === "xlsx") {
      rawRows = await parseExcel(file);
    } else if (ext === "csv") {
      rawRows = await parseCSV(file);
    } else {
      return { ...empty, error: "Unsupported format. Use PDF, XLS, XLSX, or CSV." };
    }
  } catch (err) {
    console.error("[bankParser] file read error:", err);
    return { ...empty, error: "Could not read the file. Please check it is not password-protected." };
  }

  if (rawRows.length < 2) {
    return { ...empty, error: "File appears to be empty." };
  }

  // Find header row
  const headerIdx = findHeaderRow(rawRows);
  if (headerIdx === -1) {
    return { ...empty, error: "Could not find transaction table headers. Try exporting as CSV from your bank." };
  }

  const cols = detectColumns(rawRows[headerIdx]);
  const bankDetected = detectBank(rawRows[headerIdx]);

  // Ensure we have at minimum date + desc + amount columns
  if (cols.dateCol === -1 || cols.descCol === -1) {
    // Try to use first two columns as date and description
    cols.dateCol = 0;
    cols.descCol = 1;
  }
  if (cols.debitCol === -1 && cols.creditCol === -1 && cols.amountCol === -1) {
    return { ...empty, error: "Could not find amount columns. Try exporting as CSV from your bank." };
  }

  // Parse data rows
  const dataRows = rawRows.slice(headerIdx + 1);
  const raw = rowsToTransactions(dataRows, cols);

  // Apply recurring detection
  const withRecurring = detectRecurring(raw.map((t) => ({ ...t, isRecurring: false })));

  // Final typed array
  const transactions: ParsedTransaction[] = withRecurring;
  const summary = computeSummary(transactions, bankDetected);

  return { transactions, summary };
}
