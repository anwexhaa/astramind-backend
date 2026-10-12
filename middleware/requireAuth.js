import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.js";

// Verifying an ID token only needs the project ID: firebase-admin checks the
// signature against Google's public keys, so no service-account secret is stored.
if (!getApps().length) {
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
}

async function findOrCreateUser(uid, email) {
  try {
    // Upsert so a first request (or two racing ones) creates exactly one user.
    return await User.findOneAndUpdate(
      { firebaseUID: uid },
      { $setOnInsert: { firebaseUID: uid, email, reports: [] } },
      { new: true, upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) throw err;
    // The email already belongs to a user stored under an older UID (e.g. the
    // Firebase account was recreated). The token proves this email, so relink it.
    return await User.findOneAndUpdate(
      { email },
      { $set: { firebaseUID: uid } },
      { new: true }
    );
  }
}

/**
 * Requires a valid Firebase ID token in "Authorization: Bearer <token>".
 * Identity always comes from the verified token, never from the request body
 * or query string. Sets req.user (token claims) and req.dbUser (MongoDB user).
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Missing auth token" });
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(header.slice("Bearer ".length));
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired auth token" });
  }

  if (!decoded.email) {
    return res.status(403).json({ success: false, error: "Account has no email address" });
  }

  try {
    const email = decoded.email.toLowerCase();
    req.dbUser = await findOrCreateUser(decoded.uid, email);
    req.user = { uid: decoded.uid, email, name: decoded.name };
    next();
  } catch (err) {
    console.error("❌ Auth user lookup failed:", err.message);
    res.status(500).json({ success: false, error: "Failed to load user" });
  }
}
