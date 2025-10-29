// utils/pluginClient.js
import fetch from "node-fetch";

export const getStockData = async (symbol) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plugin/stock/${symbol}`
);
    const result = await response.json();
    if (result.success) return result.data;
    return null;
  } catch (err) {
    console.error("Plugin fetch error:", err);
    return null;
  }
};
