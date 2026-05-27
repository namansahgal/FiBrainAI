/**
 * src/lib/parsers/categorizer.ts
 *
 * Keyword-based transaction categorizer for Indian startup bank statements.
 * Runs fully server-side (no API calls — pure string matching).
 */

export type CategoryResult = {
  category: string;
  confidence: number;
};

type Rule = {
  category: string;
  keywords: string[];
  confidence: number;
  /** Only match if transaction type is 'credit' */
  creditOnly?: boolean;
  /** Only match credits above this amount (for revenue detection) */
  minAmount?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Category rules — ordered by priority (first match wins)
// ─────────────────────────────────────────────────────────────────────────────
const RULES: Rule[] = [
  // ── Taxes ─────────────────────────────────────────────────────────────────
  {
    category: "Taxes",
    confidence: 0.95,
    keywords: [
      "GST", "TDS", "INCOME TAX", "ADVANCE TAX", "TCS ",
      "PROFESSIONAL TAX", "SGST", "CGST", "IGST",
      "NSDL TDS", "INCOME TAX DEPT",
    ],
  },

  // ── Salaries ──────────────────────────────────────────────────────────────
  {
    category: "Salaries",
    confidence: 0.95,
    keywords: [
      "SALARY", "PAYROLL", "NEFT-SAL", "MONTHLY SAL",
      "WAGES", "COGNIZANT", "INFOSYS", "WIPRO",
      "ACCENTURE", "HCL TECH", "TECH MAHINDRA",
      "ZOMATO PAY SALARY", "SWIGGY SALARY",
      "SAL-", "STAFF SAL",
    ],
  },

  // ── Cloud Infrastructure ──────────────────────────────────────────────────
  {
    category: "Cloud",
    confidence: 0.95,
    keywords: [
      "AMAZON WEB SERVICES", "AWS ", "MICROSOFT AZURE",
      "GOOGLE CLOUD", "GCP ", "DIGITALOCEAN",
      "LINODE", "VULTR", "CLOUDFLARE",
      "AWS.AMAZON", "AMAZONWEBSERVICES",
    ],
  },

  // ── SaaS Tools ────────────────────────────────────────────────────────────
  {
    category: "SaaS Tools",
    confidence: 0.90,
    keywords: [
      "NOTION", "FIGMA", "SLACK", "ZOOM",
      "GITHUB", "GITLAB", "JIRA", "ATLASSIAN",
      "HUBSPOT", "INTERCOM", "MIXPANEL", "SEGMENT",
      "AMPLITUDE", "POSTMAN", "LINEAR", "VERCEL",
      "NETLIFY", "OPENAI", "ANTHROPIC",
      "SENDGRID", "TWILIO", "STRIPE FEE",
      "RAZORPAY FEE", "LOOM", "MIRO",
      "AIRTABLE", "CLICKUP", "FRESHDESK",
      "ZENDESK", "SALESFORCE", "GOOGLE WORKSPACE",
      "GSUITE", "MICROSOFT 365", "DROPBOX",
      "1PASSWORD", "LASTPASS", "DATADOG",
      "SENTRY", "PAGERDUTY", "RETOOL",
      "WEBFLOW", "BUBBLE.IO",
    ],
  },

  // ── Marketing & Advertising ───────────────────────────────────────────────
  {
    category: "Marketing",
    confidence: 0.90,
    keywords: [
      "GOOGLE ADS", "GOOGLE ADWORDS",
      "META ADS", "FACEBOOK ADS", "INSTAGRAM ADS",
      "LINKEDIN ADS", "TWITTER ADS", "YOUTUBE ADS",
      "INFLUENCER", "AFFILIATE",
    ],
  },

  // ── Office & Workspace ────────────────────────────────────────────────────
  {
    category: "Office",
    confidence: 0.85,
    keywords: [
      "RENT", "LEASE", "WORKSPACE",
      "WEWORK", "AWFIS", "91SPRINGBOARD",
      "COWORKING", "OFFICE SPACE",
      "BUILDING RENT", "PROPERTY RENT",
    ],
  },

  // ── Food & Delivery ───────────────────────────────────────────────────────
  {
    category: "Food",
    confidence: 0.90,
    keywords: [
      "SWIGGY", "ZOMATO", "BLINKIT",
      "ZEPTO", "DUNZO", "BIGBASKET",
      "DOMINOS", "MCDONALDS", "SUBWAY",
      "STARBUCKS", "KFC ", "PIZZA HUT",
      "FRESH MENU",
    ],
  },

  // ── Travel & Transport ────────────────────────────────────────────────────
  {
    category: "Travel",
    confidence: 0.88,
    keywords: [
      "UBER", "OLA ", "RAPIDO",
      "MAKEMYTRIP", "GOIBIBO", "YATRA",
      "IRCTC", "INDIGO", "AIRASIA",
      "SPICEJET", "AIR INDIA", "VISTARA",
      "IXIGO", "CLEARTRIP",
    ],
  },

  // ── Legal & Compliance ────────────────────────────────────────────────────
  {
    category: "Legal",
    confidence: 0.85,
    keywords: [
      "ADVOCATE", "LEGAL", "ROC ",
      "MCA ", "COMPANY SECRETARY", "CS FEE",
      "TRADEMARK", "PATENT", "COMPLIANCE",
      "REGISTRAR OF COMPANIES",
    ],
  },

  // ── Revenue — CREDIT only, amount > 10000 ─────────────────────────────────
  {
    category: "Revenue",
    confidence: 0.80,
    creditOnly: true,
    minAmount: 10000,
    keywords: [
      "NEFT CR", "IMPS CR", "RTGS CR", "UPI CR",
      "CLIENT PAYMENT", "INVOICE",
      "PAYMENT RECEIVED", "RECEIVED FROM",
      "INWARD NEFT", "INWARD RTGS",
      "CREDIT TRANSFER",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main categorize function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Categorize a single transaction by its description.
 *
 * @param description - raw transaction narration/description
 * @param type        - 'debit' | 'credit' (optional, improves accuracy)
 * @param amount      - transaction amount in INR (optional, used for Revenue rule)
 */
export function categorize(
  description: string,
  type?: "debit" | "credit",
  amount?: number
): CategoryResult {
  const upper = description.toUpperCase();

  for (const rule of RULES) {
    // Skip credit-only rules for debits
    if (rule.creditOnly && type !== "credit") continue;
    // Skip revenue rule for small amounts
    if (rule.minAmount && (amount ?? 0) < rule.minAmount) continue;

    for (const kw of rule.keywords) {
      if (upper.includes(kw)) {
        return { category: rule.category, confidence: rule.confidence };
      }
    }
  }

  return { category: "Other", confidence: 0.5 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recurring detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark transactions as recurring if the same merchant keyword
 * appears more than once across the whole dataset.
 */
export function detectRecurring<
  T extends { description: string; isRecurring: boolean }
>(transactions: T[]): T[] {
  // Build a frequency map of the first "significant word" of each description
  const freq = new Map<string, number>();

  for (const tx of transactions) {
    const key = getMerchantKey(tx.description);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }

  return transactions.map((tx) => ({
    ...tx,
    isRecurring: (freq.get(getMerchantKey(tx.description)) ?? 0) > 1,
  }));
}

/** Extract a normalised merchant key from a description */
function getMerchantKey(description: string): string {
  return description
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3) // first 3 words
    .join(" ");
}
