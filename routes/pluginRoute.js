// routes/pluginRoute.js
import express from "express";
import fetch from "node-fetch";

console.log("🔑 API_NINJAS_KEY loaded:", !!process.env.API_NINJAS_KEY);

const router = express.Router();

router.get("/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await fetch(`https://api.api-ninjas.com/v1/stockprice?ticker=${symbol}`, {
      headers: { "X-Api-Key": process.env.API_NINJAS_KEY }
    });
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
