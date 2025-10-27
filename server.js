import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { createRequire } from "module";
import { GoogleGenerativeAI } from "@google/generative-ai";
import visualizeRoute from "./routes/visualizeRoute.js";
import reportRoute from "./routes/reportRoute.js";
import { connectDB } from "./config/db.js";


const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// ✅ Load environment variables
dotenv.config();
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/api/visualize", visualizeRoute);
app.use("/api/reports", reportRoute);


// ✅ Initialize Gemini safely
let model;
try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  console.log("✅ Gemini initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Gemini:", error);
  process.exit(1);
}

// ✅ File validation
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// ✅ Text cleanup
function preprocessText(rawText = "") {
  return rawText.replace(/\s+/g, " ").trim();
}

// ✅ Parse text values like "50M USD" → number
function parseFinancialNumber(str) {
  if (!str) return null;
  const cleaned = str.replace(/[^0-9.\-MB%]/gi, "");
  let num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  if (cleaned.toUpperCase().includes("B")) num *= 1_000_000_000;
  else if (cleaned.toUpperCase().includes("M")) num *= 1_000_000;
  else if (cleaned.includes("%")) num = parseFloat(cleaned);
  return num;
}

// ✅ Gemini helper
async function askGemini(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ✅ Safe JSON parser
function safeParse(jsonStr) {
  try {
    const match = jsonStr.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { raw: jsonStr };
  } catch {
    return { raw: jsonStr };
  }
}

// ✅ /analyze endpoint (UNCHANGED)
app.post("/analyze", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Max 10 MB allowed." });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      let text = "";
      let pdfData = null;

      if (req.file) {
        console.log("Parsing PDF...");
        pdfData = await pdf(req.file.buffer);
        text = preprocessText(pdfData.text);
        console.log(`✅ Parsed ${pdfData.numpages} pages, ${text.length} chars`);
      } else if (req.body.text) {
        text = preprocessText(req.body.text);
      } else {
        return res.status(400).json({ error: "No PDF or text provided" });
      }

      // === Gemini queries ===
      const summaryRaw = await askGemini(
        `Act as a financial analyst. Summarize this document briefly. Respond as JSON: {"summary": "..."}\n\n${text}`
      );
      const financialsRaw = await askGemini(
        `Extract key financial data (revenue, funding, profit margin). Respond as JSON: {"revenue": "...", "funding": "...", "profit_margin": "..."}; use "N/A" if missing.\n\n${text}`
      );
      const marketRaw = await askGemini(
        `Analyze market situation and list 2–3 investor risks. Respond as JSON: {"market_analysis": "...", "risks": ["...", "..."]}\n\n${text}`
      );
      const recommendationRaw = await askGemini(
        `Give a one-line investment recommendation. Respond as JSON: {"recommendation": "..."}\n\n${text}`
      );

      // === Parse responses safely ===
      const summary = safeParse(summaryRaw);
      const financials = safeParse(financialsRaw);
      const market = safeParse(marketRaw);
      const recommendation = safeParse(recommendationRaw);

      // ✅ Extract and normalize numbers for charts
      const revenueVal = parseFinancialNumber(financials.revenue);
      const fundingVal = parseFinancialNumber(financials.funding);
      const profitVal = parseFinancialNumber(financials.profit_margin);

      // ✅ Create chart data
      const chart_data = {
        revenue: revenueVal,
        funding: fundingVal,
        profit_margin: profitVal,
        labels: ["Q1", "Q2", "Q3", "Q4"],
        revenue_trend: [
          revenueVal ? revenueVal * 0.8 : 40,
          revenueVal ? revenueVal * 0.9 : 50,
          revenueVal || 60,
          revenueVal ? revenueVal * 1.1 : 70,
        ],
        profit_trend: [
          profitVal ? profitVal * 0.8 : 8,
          profitVal ? profitVal * 0.9 : 10,
          profitVal || 12,
          profitVal ? profitVal * 1.1 : 14,
        ],
      };

      // ✅ Visual hints (optional)
      const riskLevel =
        (market.risks?.length || 0) >= 3
          ? "high"
          : (market.risks?.length || 0) === 2
          ? "medium"
          : "low";

      const colorTheme =
        riskLevel === "high"
          ? "#F87171"
          : riskLevel === "medium"
          ? "#FBBF24"
          : "#34D399";

      // === 🧠 Hybrid AI-based score generation ===
      const scorePrompt = `
      You are a senior financial analyst. Based on the following data, give an overall investment score (0–100):

      Revenue: ${financials.revenue}
      Funding: ${financials.funding}
      Profit Margin: ${financials.profit_margin}
      Market Analysis: ${market.market_analysis}
      Risks: ${market.risks?.join(", ") || "None"}

      Respond only as JSON: {"score": <number>}
      `;
      const scoreRaw = await askGemini(scorePrompt);
      const scoreParsed = safeParse(scoreRaw);

      // === Apply logic adjustments ===
      let hybridScore = scoreParsed.score || 75;

      if (!revenueVal || !profitVal) hybridScore -= 5;
      if (riskLevel === "high") hybridScore -= 10;
      else if (riskLevel === "medium") hybridScore -= 5;
      if (profitVal && profitVal > 20) hybridScore += 5;

      hybridScore = Math.min(100, Math.max(0, hybridScore));

      const analysis = {
        original_text_snippet: text.slice(0, 200),
        summary: summary.summary || summary.raw,
        financial_highlights: financials,
        market_analysis: market.market_analysis || market.raw,
        risks: market.risks || [],
        investment_recommendation:
          recommendation.recommendation || recommendation.raw,
        overall_score: hybridScore,
        chart_data,
        visual_hints: { riskLevel, colorTheme },
        pdf_pages: pdfData ? pdfData.numpages : null,
        pdf_info: pdfData ? pdfData.info : null,
      };

      res.json(analysis);
    } catch (e) {
      console.error("❌ /analyze error:", e);
      res.status(500).json({
        error: "Failed to process document",
        details: e.message,
      });
    }
  });
});

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
