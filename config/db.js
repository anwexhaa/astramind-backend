import mongoose from "mongoose";

// Last connection failure, reported (name and reason only) by GET /api/health.
export let lastDbError = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || "";
  const isLocal = /^mongodb:\/\/(localhost|127\.0\.0\.1)/.test(uri);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      // TLS on for any remote database (Atlas requires it), with certificate
      // and hostname verification left on (the driver defaults).
      tls: !isLocal,
    });
    lastDbError = null;
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    lastDbError = err;
    console.error("❌ MongoDB connection failed:", err);
  }
};
