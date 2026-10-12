// routes/uploadRoute.js
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { createRequire } from "module";
import { model } from "../utils/gemini.js";
import Report from "../models/report.js";
import { ownedBy } from "../utils/ownership.js";

dotenv.config();
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const router = express.Router();

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
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // ✅ Step 1: The user comes from the verified token (requireAuth)
    const user = req.dbUser;

    // ✅ Step 2: Parse PDF
    const pdfData = await pdf(req.file.buffer);
    console.log(`✅ Parsed ${pdfData.numpages} pages, ${pdfData.text.length} chars`);

    const text = pdfData.text.replace(/\s+/g, " ").trim();

    // ✅ Step 3: Ask Gemini
    const summaryRaw = await askGemini(
      `Summarize this financial report briefly (3–4 lines). Respond as JSON: {"summary":"..."}\n\n${text}`
    );

    let summary = summaryRaw;
    try {
      const match = summaryRaw.match(/\{[\s\S]*\}/);
      if (match) summary = JSON.parse(match[0]).summary;
    } catch {
      summary = summaryRaw;
    }

    // ✅ Step 4: Prevent duplicate report filenames per user
    const existing = await Report.findOne({
      filename: req.file.originalname,
      ...ownedBy(user),
    });

    if (existing) {
      return res.json({
        success: true,
        message: "File already exists for this user",
        report: existing,
      });
    }

    // ✅ Step 5: Save the new report
    const newReport = new Report({
      filename: req.file.originalname,
      summary,
      pdf_pages: pdfData.numpages,
      userId: String(user._id),
      userEmail: user.email,
    });

    await newReport.save();

    // ✅ Step 6: Link to user and save
    user.reports.push(newReport._id);
    await user.save();

    console.log(`✅ Report saved for ${user.email}: ${newReport.filename}`);

    res.json({
      success: true,
      message: "Report uploaded and saved successfully",
      report: {
        _id: newReport._id,
        filename: newReport.filename,
        summary: newReport.summary,
      },
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to upload and analyze PDF",
      details: err.message,
    });
  }
});

export default router;
