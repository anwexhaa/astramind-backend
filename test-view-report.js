import mongoose from "mongoose";
import Report from "./models/report.js";
import dotenv from "dotenv";

dotenv.config();

async function viewReport() {
  try {
    // Connect with proper SSL options
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log("✅ Connected to MongoDB");

    const report = await Report.findById("68ff4bfaf7b5af782eca3bc0");
    
    if (!report) {
      console.log("❌ Report not found");
      return;
    }

    console.log("\n📊 Saved Report Details:");
    console.log("========================");
    console.log(`ID: ${report._id}`);
    console.log(`Summary: ${report.summary}`);
    console.log(`Score: ${report.overall_score}`);
    console.log(`Risks: ${report.risks.join(", ")}`);
    console.log(`Created: ${report.created_at}`);
    console.log("\n💰 Financial Highlights:");
    console.log(JSON.stringify(report.financial_highlights, null, 2));

    await mongoose.connection.close();
    console.log("\n✅ Connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

viewReport();