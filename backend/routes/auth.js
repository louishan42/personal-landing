const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signToken, authMiddleware } = require("../middleware/auth");
const { getUserStats, formatUser, validateUsername } = require("../lib/userStats");
const {
  verifyGoogleToken,
  isGmailEmail,
  dbErrorMessage,
} = require("../lib/googleAuth");

const router = express.Router();

router.get("/check-username/:username", async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const validationError = validateUsername(username);
    if (validationError) {
      return res.json({ available: false, error: validationError });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    res.json({ available: !existing });
  } catch (err) {
    console.error("Check username error:", err);
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Failed to check username" });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Google credential is required" });
    }

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID.includes("REPLACE_ME") ||
      process.env.GOOGLE_CLIENT_ID.includes("your-google-client-id")
    ) {
      return res.status(503).json({
        error: "Google Sign-In not configured. Add a real GOOGLE_CLIENT_ID to backend/.env — see SETUP.md",
      });
    }

    const payload = await verifyGoogleToken(credential);

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ error: "Google account email is not verified" });
    }

    if (!isGmailEmail(payload.email)) {
      return res.status(400).json({ error: "Only Gmail accounts (@gmail.com) are allowed" });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatarUrl: user.avatarUrl || payload.picture || null,
          },
        });
      }
    } else {
      const tempUsername = `pending_${googleId.slice(-8)}`;

      user = await prisma.user.create({
        data: {
          email,
          username: tempUsername,
          googleId,
          displayName: payload.name || email.split("@")[0],
          avatarUrl: payload.picture || null,
          profileSetupComplete: false,
        },
      });
    }

    const stats = await getUserStats(user.id);
    const token = signToken(user.id, user.isAdmin);

    res.json({
      token,
      user: formatUser(user, stats),
      needsSetup: !user.profileSetupComplete,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Google sign-in failed" });
  }
});

router.post("/setup-profile", authMiddleware, async (req, res) => {
  try {
    const { username, displayName, location } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const normalized = username.toLowerCase();
    const validationError = validateUsername(normalized);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const taken = await prisma.user.findFirst({
      where: {
        username: normalized,
        id: { not: req.user.id },
      },
    });

    if (taken) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username: normalized,
        displayName: displayName || req.user.displayName,
        location: location || "",
        profileSetupComplete: true,
      },
    });

    const stats = await getUserStats(user.id);
    const token = signToken(user.id, user.isAdmin);

    res.json({ token, user: formatUser(user, stats) });
  } catch (err) {
    console.error("Setup profile error:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Username is already taken" });
    }
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Failed to set up profile" });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), isAdmin: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const stats = await getUserStats(user.id);
    const token = signToken(user.id, true);

    res.json({ token, user: formatUser(user, stats) });
  } catch (err) {
    console.error("Admin login error:", err);
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Admin login failed" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const stats = await getUserStats(req.user.id);
    res.json({ user: formatUser(req.user, stats) });
  } catch (err) {
    console.error("Me error:", err);
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Failed to fetch profile" });
  }
});

module.exports = router;
