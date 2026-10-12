import express from "express";

const router = express.Router();

/**
 * ✅ Sync Firebase user with MongoDB
 * Called right after Firebase login on the frontend. requireAuth has already
 * verified the token and found or created the user, so this just returns it.
 */
router.post("/sync", (req, res) => {
  res.json({
    success: true,
    message: "User synced successfully",
    user: req.dbUser,
  });
});

export default router;
