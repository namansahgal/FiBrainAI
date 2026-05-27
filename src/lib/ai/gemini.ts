import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export async function generateInsight(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n${prompt}`
    : prompt;

  // Retry up to 2 times with backoff for rate limits
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      const message = (error as { message?: string }).message ?? "";

      console.error(
        `[Gemini] attempt ${attempt + 1}/3 failed:`,
        status,
        message.slice(0, 200)
      );

      // Retry on rate limit (429) with exponential backoff
      if (status === 429 && attempt < 2) {
        const delay = (attempt + 1) * 5000; // 5s, 10s
        console.log(`[Gemini] rate limited, retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Don't retry on other errors
      break;
    }
  }

  return "Unable to generate insight at this time. Please try again in a moment.";
}
