import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// 🔹 LIVE STOCK SNAPSHOT (unchanged)
router.get("/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    const response = await fetch(
      `https://api.api-ninjas.com/v1/stockprice?ticker=${symbol}`,
      {
        headers: {
          "X-Api-Key": process.env.API_NINJAS_KEY,
          Accept: "application/json",
        },
      }
    );

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", text.slice(0, 100));
      return res
        .status(500)
        .json({ success: false, error: "API returned invalid response" });
    }

    const data = await response.json();
    if (!data || Object.keys(data).length === 0)
      return res
        .status(404)
        .json({ success: false, error: "No stock data found" });

    res.json({ success: true, data });
  } catch (err) {
    console.error("Plugin Error:", err);
    res
      .status(500)
      .json({ success: false, error: "Plugin request failed (live)" });
  }
});

// 🔹 HISTORICAL STOCK DATA (hourly, FMP free-tier)
router.get("/stock/history/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const apiKey = process.env.TWELVE_API_KEY;

    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=15&apikey=${apiKey}`
    );

    const data = await response.json();
    if (!data.values || !Array.isArray(data.values))
      return res.status(404).json({ success: false, error: "No data found" });

    const history = data.values
      .reverse()
      .map((v) => ({ date: v.datetime, close: parseFloat(v.close) }));

    res.json({ success: true, history });
  } catch (err) {
    console.error("TwelveData Error:", err);
    res.status(500).json({ success: false, error: "TwelveData request failed" });
  }
});

export default router;
