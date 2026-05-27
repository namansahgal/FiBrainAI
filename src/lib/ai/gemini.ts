import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function generateInsight(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  try {
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[Gemini] error:", error);
    return "Unable to generate insight at this time.";
  }
}
