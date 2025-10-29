import express from "express";
import User from "../models/user.js";

const router = express.Router();

/**
 * ✅ Sync Firebase user with MongoDB
 * Called right after Firebase login on the frontend
 */
router.post("/sync", async (req, res) => {
  try {
    const { firebaseUID, email, name } = req.body;

    if (!firebaseUID || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing firebaseUID or email",
      });
    }

    // 🧠 Try to find existing user by Firebase UID or email
    let user = await User.findOne({ $or: [{ firebaseUID }, { email }] });

    if (!user) {
      // ✅ Create new MongoDB user if not found
      user = new User({
        firebaseUID,
        email,
        name: name || "Unnamed User",
        reports: [],
      });
      await user.save();
      console.log("✅ New MongoDB user created:", email);
    } else {
      // ✅ Update existing user details if needed
      user.name = name || user.name;
      user.email = email || user.email;
      await user.save();
      console.log("ℹ️ Existing MongoDB user synced:", email);
    }

    return res.json({
      success: true,
      message: "User synced successfully",
      user,
    });
  } catch (err) {
    // 🧩 Handle duplicate key error gracefully
    if (err.code === 11000) {
      console.warn("⚠️ Duplicate user sync attempt:", req.body.email);
      return res.status(200).json({
        success: true,
        message: "User already exists — skipping duplicate insert",
      });
    }

    console.error("❌ Error syncing user:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to sync user",
      details: err.message,
    });
  }
});

export default router;
