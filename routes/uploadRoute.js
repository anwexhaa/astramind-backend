// routes/uploadRoute.js
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { createRequire } from "module";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Report from "../models/report.js";

dotenv.config();
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ✅ Multer config
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Gemini helper
async function askGemini(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ✅ POST /api/upload
router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const pdfData = await pdf(req.file.buffer);
    const text = pdfData.text.replace(/\s+/g, " ").trim();

    const summaryRaw = await askGemini(
      `Summarize this financial report briefly (3–4 lines). Respond as JSON: {"summary":"..."}\n\n${text}`
    );

    // Try to parse Gemini output safely
    let summary = summaryRaw;
    try {
      const match = summaryRaw.match(/\{[\s\S]*\}/);
      if (match) summary = JSON.parse(match[0]).summary;
    } catch {
      summary = summaryRaw;
    }

    // Save minimal info to DB
    const saved = await Report.create({
      filename: req.file.originalname,
      summary,
    });

    res.json({
      success: true,
      report: {
        _id: saved._id,
        filename: saved.filename,
        summary: saved.summary,
      },
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, error: "Failed to upload and analyze PDF" });
  }
});

export default router;
