// aihelpers.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 🔹 Helper to safely parse JSON responses
function safeJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// ------------------------------
// MAIN AI HELPERS
// ------------------------------

export async function generateSummary(text) {
  const prompt = `
  Summarize the document in 4–5 sentences.
  Return only JSON in this format:
  { "summary": "..." }
  Text:
  ${text.slice(0, 5000)}  // limit for safety
  `;
  const result = await model.generateContent(prompt);
  return safeJSON(result.response.text()).summary;
}

export async function extractFinancialHighlights(text) {
  const prompt = `
  Extract key financial details (revenue, funding, profit margin, or say "N/A").
  Return JSON like:
  {
    "revenue": "...",
    "funding": "...",
    "profit_margin": "..."
  }
  Text:
  ${text.slice(0, 5000)}
  `;
  const result = await model.generateContent(prompt);
  return safeJSON(result.response.text());
}

export async function analyzeMarketAndRisks(text) {
  const prompt = `
  Analyze market context and list 2–3 major risks if applicable.
  Return only JSON:
  {
    "market_analysis": "...",
    "risks": ["...", "..."]
  }
  Text:
  ${text.slice(0, 5000)}
  `;
  const result = await model.generateContent(prompt);
  return safeJSON(result.response.text());
}

export async function generateRecommendation(text) {
  const prompt = `
  Give an investment recommendation in one line based on the content.
  Return JSON: { "recommendation": "..." }
  Text:
  ${text.slice(0, 5000)}
  `;
  const result = await model.generateContent(prompt);
  return safeJSON(result.response.text()).recommendation;
}

export async function computeScore(summary, financials, marketAndRisks) {
  const prompt = `
  Based on the analysis, assign an overall numeric score (0–100)
  reflecting clarity, completeness, and reliability.
  Return JSON: { "score": number }
  Summary: ${summary}
  Financials: ${JSON.stringify(financials)}
  Market: ${JSON.stringify(marketAndRisks)}
  `;
  const result = await model.generateContent(prompt);
  return safeJSON(result.response.text()).score || 75;
}
