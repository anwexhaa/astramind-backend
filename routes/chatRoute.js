// routes/chatRoute.js
import express from "express";
import Report from "../models/report.js";
import { ownedBy } from "../utils/ownership.js";
import { model } from "../utils/gemini.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const { query, reportIds } = req.body;
    if (!query) return res.status(400).json({ error: "Query text is required." });

    // 🧠 Detect if query is financial or casual
    const financeKeywords = [
      "stock", "market", "investment", "report", "revenue", "profit",
      "financial", "trend", "valuation", "risk", "growth", "company", "performance"
    ];
    const isFinanceQuery = financeKeywords.some((kw) =>
      query.toLowerCase().includes(kw)
    );

    // If it's casual chat, skip report context
    if (!isFinanceQuery) {
      const casualPrompt = `
You are AstraMind, a friendly and intelligent AI built to assist with financial insights,
but you can also chat casually like a human. 
If the user’s question isn’t financial, just respond casually, naturally, and warmly.

User: "${query}"
`;

      const casualResult = await model.generateContent(casualPrompt);
      const casualText = casualResult.response.text();

      return res.json({
        success: true,
        mode: "casual",
        answer: casualText.trim(),
      });
    }

    // 🏦 Otherwise, go financial analysis mode
    let reports;
    if (Array.isArray(reportIds) && reportIds.length > 0) {
      reports = await Report.find({ _id: { $in: reportIds }, ...ownedBy(req.dbUser) });
    } else {
      reports = await Report.find(ownedBy(req.dbUser)).sort({ created_at: -1 }).limit(3);
    }

    if (reports.length === 0)
      return res.status(404).json({ error: "No reports found to analyze." });

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

    const financePrompt = `
You are a financial analysis assistant. 
Given the following saved reports, answer the user's question clearly and concisely.
Be structured and analytical — use bullet points if needed.

${context}

User question: "${query}"

Return your answer as JSON:
{"response": "<your analysis here>"}
`;

    const result = await model.generateContent(financePrompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]);
    } catch {
      parsed = { response: text };
    }

    res.json({
      success: true,
      mode: "financial",
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
