import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini models get retired over time (gemini-2.5-flash now returns 404 for
// many keys), so calls try each model in order. GEMINI_MODEL, if set, goes first.
const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
].filter(Boolean);

// Errors that mean "this model can't serve the request, try the next one":
// retired or unknown model (404), quota used up (429), or overloaded (500/503).
const NEXT_MODEL_STATUSES = new Set([404, 429, 500, 503]);
function shouldTryNextModel(err) {
  return NEXT_MODEL_STATUSES.has(err?.status) ||
    /not found|no longer available|quota|high demand|unavailable/i.test(err?.message || "");
}

/**
 * Drop-in for a GenerativeModel: model.generateContent(prompt) returns the same
 * { response: { text() } } shape, so existing route code is unchanged.
 */
export const model = {
  async generateContent(prompt) {
    let lastErr;
    for (const name of MODELS) {
      try {
        return await genAI.getGenerativeModel({ model: name }).generateContent(prompt);
      } catch (err) {
        lastErr = err;
        if (!shouldTryNextModel(err)) throw err;
        console.warn(`⚠️ Gemini model ${name} unavailable (${err.status ?? "error"}), trying next`);
      }
    }
    throw lastErr;
  },
};
