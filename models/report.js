// models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  summary: String,
  financial_highlights: Object,
  market_analysis: String,
  risks: [String],
  investment_recommendation: String,
  overall_score: Number,
  chart_data: Object,
  visual_hints: Object,
  pdf_pages: Number,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Report", reportSchema);
