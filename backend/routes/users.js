const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { getUserStats, formatUser } = require("../lib/userStats");

const router = express.Router();

router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { displayName, bio, location } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
      },
    });

    const stats = await getUserStats(user.id);
    res.json({ user: formatUser(user, stats) });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/:username", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stats = await getUserStats(user.id);

    let followStatus = null;
    if (req.user.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: user.id,
          },
        },
      });
      followStatus = follow?.status || null;
    }

    res.json({
      user: formatUser(user, stats),
      followStatus,
      isOwnProfile: req.user.id === user.id,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/:username/follow", authMiddleware, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (target.id === req.user.id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: target.id,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Already following or request pending" });
    }

    await prisma.follow.create({
      data: {
        followerId: req.user.id,
        followingId: target.id,
        status: "PENDING",
      },
    });

    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "FOLLOW",
        content: `${req.user.displayName} sent you a follow request`,
        relatedUserId: req.user.id,
      },
    });

    res.status(201).json({ status: "PENDING" });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

router.get("/:username/moments", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const moments = await prisma.moment.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        media: { orderBy: { order: "asc" } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      moments: moments.map(formatMoment),
    });
  } catch (err) {
    console.error("User moments error:", err);
    res.status(500).json({ error: "Failed to fetch moments" });
  }
});

function formatMoment(m) {
  return {
    id: m.id,
    caption: m.caption,
    location: m.location,
    type: m.type.toLowerCase(),
    media: m.media,
    mediaCount: m.media.length,
    likes: m._count.likes,
    comments: m._count.comments,
    time: formatTimeAgo(m.createdAt),
    createdAt: m.createdAt,
    user: {
      id: m.user.id,
      name: m.user.displayName,
      username: m.user.username,
      avatar: m.user.displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    },
  };
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

module.exports = router;
