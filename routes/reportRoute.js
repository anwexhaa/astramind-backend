// routes/reportRoute.js
import express from "express";
import Report from "../models/report.js";

const router = express.Router();

// ✅ GET all saved reports (newest first, with pagination)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find()
      .sort({ created_at: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .select("-__v"); // Exclude version field

    const totalReports = await Report.countDocuments();
    const totalPages = Math.ceil(totalReports / limit);

    res.json({
      success: true,
      reports,
      pagination: {
        currentPage: page,
        totalPages,
        totalReports,
        reportsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch reports" 
    });
  }
});

// ✅ GET single report by ID
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select("-__v");
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: "Report not found" 
      });
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("❌ Error fetching report:", err);
    res.status(500).json({ 
      success: false, 
      error: "Invalid report ID or server error" 
    });
  }
});

// ✅ DELETE report by ID
router.delete("/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: "Report not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Report deleted successfully",
      deletedId: req.params.id 
    });
  } catch (err) {
    console.error("❌ Error deleting report:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete report" 
    });
  }
});

// ✅ POST new report (manual save - kept for backward compatibility)
router.post("/", async (req, res) => {
  try {
    const reportData = req.body;

    // Validate required fields
    if (!reportData.summary) {
      return res.status(400).json({ 
        success: false, 
        error: "Summary is required" 
      });
    }

    const newReport = new Report(reportData);
    await newReport.save();

    res.json({ 
      success: true, 
      message: "Report saved successfully", 
      report: newReport 
    });
  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to save report",
      details: err.message 
    });
  }
});

export default router;