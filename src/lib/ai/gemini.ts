import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

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

function getModel(keyIndex: number, systemPrompt?: string) {
  const genAI = new GoogleGenerativeAI(apiKeys[keyIndex % apiKeys.length]);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });
}

export async function generateInsight(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (apiKeys.length === 0 && !groqApiKey) {
    return "AI is not configured. Please add GEMINI_API_KEY to environment variables.";
  }

  // Try each API key, with one retry per key for transient errors
  if (apiKeys.length > 0) {
    for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = getModel(keyIdx, systemPrompt);
          const result = await model.generateContent(prompt);
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
  }

  // ── Groq Fallback ──────────────────────────────────────────────────────────
  if (groqApiKey) {
    console.log("[Gemini] Attempting Groq fallback...");
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      });

      const text = completion.choices[0]?.message?.content;
      if (text) {
        console.log("[Groq] succeeded using llama-3.3-70b-versatile");
        return text;
      }
    } catch (groqError: unknown) {
      const status = (groqError as { status?: number }).status;
      const message = (groqError as { message?: string }).message ?? "";
      console.error(
        `[Groq] fallback failed:`,
        status,
        message.slice(0, 150)
      );
    }
  } else {
    console.warn("[Groq] Groq API key is not configured for fallback.");
  }

  return "";  // Return empty string — let callers provide fallback
}
