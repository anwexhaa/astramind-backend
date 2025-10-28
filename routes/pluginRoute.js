// routes/pluginRoute.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    console.log("🔍 Fetching stock data for:", symbol);
    console.log("🔑 API key loaded:", !!process.env.API_NINJAS_KEY);

    const response = await fetch(
      `https://api.api-ninjas.com/v1/stockprice?ticker=${symbol}`,
      {
        headers: {
          "X-Api-Key": process.env.API_NINJAS_KEY,
          "Accept": "application/json",
        },
      }
    );

    // If API returns HTML (not JSON), throw a clearer error
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", text.slice(0, 100));
      return res.status(500).json({
        success: false,
        error: "API returned invalid response (likely wrong key)",
      });
    }

    const data = await response.json();

    if (!data || Object.keys(data).length === 0)
      return res.status(404).json({ success: false, error: "No data found" });

    res.json({ success: true, data });
  } catch (err) {
    console.error("Plugin Error:", err);
    res.status(500).json({ success: false, error: "Plugin request failed" });
  }
});

export default router;
