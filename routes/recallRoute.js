import express from "express";
import Report from "../models/report.js";

const router = express.Router();

// 🧠 Get all saved reports (summary view)
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find({}, "summary overall_score created_at");
    res.json({ success: true, reports });
  } catch (err) {
    console.error("Recall fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch reports" });
  }
});

// 🔍 Get a single report by ID
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report)
      return res.status(404).json({ success: false, error: "Report not found" });
    res.json({ success: true, report });
  } catch (err) {
    console.error("Recall single fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch report" });
  }
});

// 🧩 Compare two reports
router.get("/compare/:id1/:id2", async (req, res) => {
  try {
    const [r1, r2] = await Promise.all([
      Report.findById(req.params.id1),
      Report.findById(req.params.id2)
    ]);
    if (!r1 || !r2)
      return res.status(404).json({ success: false, error: "One or both reports not found" });

    const comparison = {
      summary_diff: `${r1.summary.slice(0, 100)} ... vs ... ${r2.summary.slice(0, 100)}`,
      score_diff: r1.overall_score - r2.overall_score,
      risk_change: `${r1.visual_hints.riskLevel} → ${r2.visual_hints.riskLevel}`,
    };

    res.json({ success: true, comparison });
  } catch (err) {
    console.error("Recall comparison error:", err);
    res.status(500).json({ success: false, error: "Comparison failed" });
  }
});

export default router;
