import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  // ✅ Store Firebase UID directly instead of ObjectId
  userId: { type: String, required: true }, // Firebase UID
  userEmail: { type: String, required: true }, // Firebase email

  // 📄 Report Metadata
  filename: { type: String, required: true }, // Uploaded PDF name
  summary: String,
  financial_highlights: Object,
  market_analysis: String,
  risks: [String],
  investment_recommendation: String,
  overall_score: Number,
  chart_data: Object,
  visual_hints: Object,
  pdf_pages: Number,

  // 🕒 Timestamp
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Report", reportSchema);
