import express from "express";
import Report from "../models/report.js";
import User from "../models/user.js";

const router = express.Router();

/* ============================================================
   ✅ GET all saved reports for a specific user (newest first)
   ============================================================ */
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing user email",
      });
    }

    // ✅ Case-insensitive email match (fixes "no reports found" issue)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (!user) {
      console.warn("⚠️ No user found for email:", email);
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const reports = await Report.find({ userEmail: email })
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
   ✅ GET single report by ID
   =============================================== */
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select("-__v");

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
   ✅ DELETE report by ID
   =============================================== */
router.delete("/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Remove from user's list
    await User.updateOne(
      { _id: report.userId },
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
   ✅ POST new report — tied to a specific user
   =============================================== */
router.post("/", async (req, res) => {
  try {
    const { userEmail, firebaseUID, ...reportData } = req.body;

    if (!userEmail && !firebaseUID) {
      return res.status(400).json({
        success: false,
        error: "Missing user identifier (email or firebaseUID)",
      });
    }

    // ✅ Case-insensitive user lookup (by email or UID)
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${userEmail}$`, "i") } },
        { firebaseUID },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

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
        userId: user._id,
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
      userId: user._id,
      userEmail: user.email.toLowerCase(),
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
