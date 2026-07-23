const express = require("express");
const prisma = require("../lib/prisma");
const { adminMiddleware } = require("../middleware/auth");
const { formatUser, getUserStats } = require("../lib/userStats");
const { dbErrorMessage } = require("../lib/googleAuth");

const router = express.Router();

router.get("/stats", adminMiddleware, async (_req, res) => {
  try {
    const [users, moments, experiences, messages] = await Promise.all([
      prisma.user.count(),
      prisma.moment.count(),
      prisma.experience.count(),
      prisma.message.count(),
    ]);

    res.json({
      stats: { users, moments, experiences, messages },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Failed to fetch stats" });
  }
});

router.get("/users", adminMiddleware, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        profileSetupComplete: true,
        googleId: true,
        createdAt: true,
        _count: {
          select: { moments: true, followers: true, following: true },
        },
      },
    });

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        isAdmin: u.isAdmin,
        profileSetupComplete: u.profileSetupComplete,
        hasGoogle: !!u.googleId,
        moments: u._count.moments,
        followers: u._count.followers,
        following: u._count.following,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("Admin users error:", err);
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Failed to fetch users" });
  }
});

router.delete("/users/:id", adminMiddleware, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (target.isAdmin) {
      return res.status(403).json({ error: "Cannot delete admin accounts" });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete user error:", err);
    const dbMsg = dbErrorMessage(err);
    res.status(500).json({ error: dbMsg || "Failed to delete user" });
  }
});

module.exports = router;
