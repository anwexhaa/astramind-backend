// routes/compareRoute.js
import express from "express";
import { model } from "../utils/gemini.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🔷 POST /api/compare
router.post("/", async (req, res) => {
  try {
    const { reportA, reportB } = req.body;

    if (!reportA || !reportB) {
      return res.status(400).json({ success: false, error: "Two reports are required" });
    }

    const prompt = `
Compare the following two financial analysis reports and summarize the differences in tone, 
risk level, investment recommendations, and any key data points:

Report A: ${reportA.filename}
Summary: ${reportA.summary}

Report B: ${reportB.filename}
Summary: ${reportB.summary}

Return a concise, structured comparison highlighting pros and cons of each.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ success: true, result: text });
  } catch (err) {
    console.error("❌ Compare error:", err);
    res.status(500).json({ success: false, error: "Failed to compare reports" });
  }
});

export default router;
