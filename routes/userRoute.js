import express from "express";
import User from "../models/user.js";

const router = express.Router();

// Check or create user
router.post("/sync", async (req, res) => {
  try {
    const { email, firebaseUID } = req.body;

    if (!email || !firebaseUID) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Find user
    let user = await User.findOne({ firebaseUID });

    // Create new if not found
    if (!user) {
      user = await User.create({ firebaseUID, email });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ User sync error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
