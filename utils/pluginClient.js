// utils/pluginClient.js
import fetch from "node-fetch";

export const getStockData = async (symbol) => {
  try {
    const response = await fetch(`http://localhost:3001/plugin/stock/${symbol}`);
    const result = await response.json();
    if (result.success) return result.data;
    return null;
  } catch (err) {
    console.error("Plugin fetch error:", err);
    return null;
  }
};
