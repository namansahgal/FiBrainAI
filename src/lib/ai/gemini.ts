import { GoogleGenerativeAI } from "@google/generative-ai";

// ─────────────────────────────────────────────────────────────────────────────
// Support multiple API keys for rotation when free tier quota is exhausted.
// Set GEMINI_API_KEY for primary, GEMINI_API_KEY_2/3 as backups.
// ─────────────────────────────────────────────────────────────────────────────

const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

if (apiKeys.length === 0) {
  console.warn("[Gemini] No API keys configured!");
}

function getModel(keyIndex: number) {
  const genAI = new GoogleGenerativeAI(apiKeys[keyIndex % apiKeys.length]);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export async function generateInsight(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  if (apiKeys.length === 0) {
    return "AI is not configured. Please add GEMINI_API_KEY to environment variables.";
  }

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n${prompt}`
    : prompt;

  // Try each API key, with one retry per key for transient errors
  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = getModel(keyIdx);
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
          if (keyIdx > 0) {
            console.log(`[Gemini] succeeded with key #${keyIdx + 1}`);
          }
          return text;
        }
      } catch (error: unknown) {
        const status = (error as { status?: number }).status;
        const message = (error as { message?: string }).message ?? "";

        console.error(
          `[Gemini] key #${keyIdx + 1}, attempt ${attempt + 1}/2:`,
          status,
          message.slice(0, 150)
        );

        // Rate limited — try next key immediately (don't waste time retrying same key)
        if (status === 429) {
          console.log(`[Gemini] key #${keyIdx + 1} rate limited, trying next key...`);
          break; // break inner loop, move to next key
        }

        // Transient error — retry once with small backoff
        if (attempt === 0 && status !== 400 && status !== 403) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        break;
      }
    }
  }

  console.error("[Gemini] all keys exhausted");
  return "";  // Return empty string — let callers provide fallback
}
