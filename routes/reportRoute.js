import express from "express";
import Report from "../models/report.js";
import User from "../models/user.js";
import { ownedBy } from "../utils/ownership.js";

const router = express.Router();

/* ============================================================
   ✅ GET the signed-in user's saved reports (newest first)
   ============================================================ */
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find(ownedBy(req.dbUser))
      .sort({ created_at: -1 })
      .select("-__v");

    res.json({
      success: true,
      reports,
    });
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reports",
    });
  }
});

/* ===============================================
   ✅ GET single report by ID (owner only)
   =============================================== */
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      ...ownedBy(req.dbUser),
    }).select("-__v");

    // 404 rather than 403, so ids of other users' reports are not confirmed
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("❌ Error fetching report:", err);
    res.status(500).json({
      success: false,
      error: "Invalid report ID or server error",
    });
  }
});

/* ===============================================
   ✅ DELETE report by ID (owner only)
   =============================================== */
router.delete("/:id", async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      ...ownedBy(req.dbUser),
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Remove from user's list
    await User.updateOne(
      { _id: req.dbUser._id },
      { $pull: { reports: report._id } }
    );

    res.json({
      success: true,
      message: "Report deleted successfully",
      deletedId: req.params.id,
    });
  } catch (err) {
    console.error("❌ Error deleting report:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete report",
    });
  }
});

/* ===============================================
   ✅ POST new report for the signed-in user
   =============================================== */
router.post("/", async (req, res) => {
  try {
    // Identity comes from the verified token; ignore any sent in the body
    const { userEmail, firebaseUID, userId, ...reportData } = req.body;
    const user = req.dbUser;

    // ✅ Skip saving if this is a compare-only request
    if (req.query.save === "false" || reportData.save === false) {
      return res.status(200).json({
        success: true,
        message: "Comparison only — not saving to database",
      });
    }

    // ✅ Prevent duplicate saves for same file & user
    if (reportData.filename) {
      const existing = await Report.findOne({
        filename: reportData.filename,
        ...ownedBy(user),
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "File already exists for this user",
          report: existing,
        });
      }
    }

    // ✅ Validate essential fields
    if (!reportData.summary) {
      return res.status(400).json({
        success: false,
        error: "Summary is required",
      });
    }

    // ✅ Create and save report
    const newReport = new Report({
      ...reportData,
      userId: String(user._id),
      userEmail: user.email,
    });

    await newReport.save();

    // ✅ Add to user's report list
    user.reports.push(newReport._id);
    await user.save();

    res.json({
      success: true,
      message: "Report saved successfully",
      report: newReport,
    });
  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({
      success: false,
      error: "Failed to save report",
      details: err.message,
    });
  }
});

export default router;
