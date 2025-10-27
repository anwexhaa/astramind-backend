import express from "express";
const router = express.Router();

// Utility: parse numbers like "50M USD" → 50
function parseNumber(str) {
  if (!str) return 0;
  const num = parseFloat(str.replace(/[^\d.]/g, ""));
  if (str.toLowerCase().includes("b")) return num * 1000;
  return num; // assume millions if 'M'
}

router.post("/", async (req, res) => {
  try {
    const { financial_highlights } = req.body;

    if (!financial_highlights) {
      return res.status(400).json({ error: "Missing financial_highlights" });
    }

    const { revenue, funding, profit_margin } = financial_highlights;

    const chartData = {
      labels: ["Revenue", "Funding", "Profit Margin"],
      values: [
        parseNumber(revenue),
        parseNumber(funding),
        parseFloat(profit_margin)
      ]
    };

    res.json({
      chartData,
      chartType: "bar",
      title: "Financial Overview",
      summary: "Visualization data for key financial metrics"
    });
  } catch (err) {
    console.error("Visualization Error:", err);
    res.status(500).json({ error: "Failed to generate visualization data" });
  }
});

export default router;
