import mongoose from "mongoose";

// Reported (name and reason only) by GET /api/health.
export let lastDbError = null;
export let dbMode = "none"; // "atlas" | "in-memory" | "none"

const OPTIONS = { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 };

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || "";
  const isLocal = /^mongodb:\/\/(localhost|127\.0\.0\.1)/.test(uri);

  if (uri) {
    try {
      // TLS on for any remote database (Atlas requires it), with certificate
      // and hostname verification left on (the driver defaults).
      await mongoose.connect(uri, { ...OPTIONS, tls: !isLocal });
      lastDbError = null;
      dbMode = "atlas";
      console.log("✅ MongoDB connected successfully");
      return;
    } catch (err) {
      lastDbError = err;
      console.error("❌ MongoDB connection failed:", err.message);
    }
  }

  // Fallback so the app keeps working when the configured database is
  // missing: a MongoDB server inside this process. Data is NOT persistent; it
  // is lost whenever the server restarts or the free instance goes to sleep.
  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const memory = await MongoMemoryServer.create({
      instance: { args: ["--wiredTigerCacheSizeGB", "0.25"] },
    });
    await mongoose.connect(memory.getUri("astramind"), OPTIONS);
    dbMode = "in-memory";
    console.warn("⚠️ Using a temporary in-memory MongoDB: saved data is lost on restart");
  } catch (err) {
    lastDbError = err;
    console.error("❌ In-memory MongoDB failed to start:", err.message);
  }
};
