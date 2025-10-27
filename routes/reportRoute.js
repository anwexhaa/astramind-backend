// routes/reportRoute.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const dataPath = path.resolve("./data/reports.json");

// ✅ Ensure data folder exists
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "[]");

// ✅ GET all saved reports
router.get("/", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read saved reports" });
  }
});

// ✅ POST new report
router.post("/", (req, res) => {
  try {
    const { companyName, analysis } = req.body;
    if (!companyName || !analysis) {
      return res.status(400).json({ error: "Missing companyName or analysis" });
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const newEntry = {
      id: Date.now().toString(),
      companyName,
      analysis,
      savedAt: new Date().toISOString(),
    };

    data.push(newEntry);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    res.json({ message: "Report saved successfully", report: newEntry });
  } catch (err) {
    console.error("Error saving report:", err);
    res.status(500).json({ error: "Failed to save report" });
  }
});

export default router;
