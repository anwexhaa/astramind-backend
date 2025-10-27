// routes/chatRoute.js
import express from "express";
import Report from "../models/report.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ✅ Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ✅ POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { query, reportIds } = req.body;

    if (!query)
      return res.status(400).json({ error: "Query text is required." });

    // 🧠 Fetch selected reports (or all if none specified)
    let reports;
    if (Array.isArray(reportIds) && reportIds.length > 0) {
      reports = await Report.find({ _id: { $in: reportIds } });
    } else {
      reports = await Report.find().sort({ created_at: -1 }).limit(3);
    }

    if (reports.length === 0)
      return res.status(404).json({ error: "No reports found to analyze." });

    // Format data for AI prompt
    const context = reports
      .map(
        (r, i) => `
Report ${i + 1}:
Summary: ${r.summary}
Financials: ${JSON.stringify(r.financial_highlights)}
Market: ${r.market_analysis}
Risks: ${r.risks?.join(", ")}
Recommendation: ${r.investment_recommendation}
Overall Score: ${r.overall_score}
`
      )
      .join("\n");

    const prompt = `
You are a financial analysis assistant. 
Given the following saved reports, answer the user's question clearly and concisely.
Be objective, structured, and analytical.

${context}

User question: "${query}"

Return your answer as JSON: 
{"response": "<your analysis here>"}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON safely
    let parsed;
    try {
      parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]);
    } catch {
      parsed = { response: text };
    }

    res.json({
      success: true,
      question: query,
      answer: parsed.response || parsed,
      comparedReports: reports.length,
    });
  } catch (err) {
    console.error("❌ Chat route error:", err);
    res.status(500).json({ error: "AI chat failed", details: err.message });
  }
});

export default router;
