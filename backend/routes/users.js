const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { getUserStats, formatUser } = require("../lib/userStats");

const router = express.Router();

router.get("/search", authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        profileSetupComplete: true,
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    });

    const results = await Promise.all(
      users.map(async (u) => {
        const stats = await getUserStats(u.id);
        return formatUser(u, stats);
      })
    );

    res.json({ users: results });
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

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
      if (existing.status === "ACCEPTED") {
        return res.status(409).json({ error: "Already friends" });
      }
      await prisma.follow.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED" },
      });
    } else {
      await prisma.follow.create({
        data: {
          followerId: req.user.id,
          followingId: target.id,
          status: "ACCEPTED",
        },
      });
    }

    // Mutual friendship so both users see each other's posts in feed
    const reverse = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: target.id,
          followingId: req.user.id,
        },
      },
    });

    if (reverse) {
      if (reverse.status !== "ACCEPTED") {
        await prisma.follow.update({
          where: { id: reverse.id },
          data: { status: "ACCEPTED" },
        });
      }
    } else {
      await prisma.follow.create({
        data: {
          followerId: target.id,
          followingId: req.user.id,
          status: "ACCEPTED",
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "FOLLOW",
        content: `${req.user.displayName} added you as a friend`,
        relatedUserId: req.user.id,
      },
    });

    return res.status(existing ? 200 : 201).json({ status: "ACCEPTED", mutual: true });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Failed to add friend" });
  }
});

router.delete("/:username/follow", authMiddleware, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: req.user.id, followingId: target.id },
          { followerId: target.id, followingId: req.user.id },
        ],
      },
    });

    res.json({ status: "NONE" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

router.get("/friends/list", authMiddleware, async (req, res) => {
  try {
    const outgoing = await prisma.follow.findMany({
      where: { followerId: req.user.id, status: "ACCEPTED" },
      select: { followingId: true },
    });

    const incoming = await prisma.follow.findMany({
      where: { followingId: req.user.id, status: "ACCEPTED" },
      select: { followerId: true },
    });

    const friendIdSet = new Set([
      ...outgoing.map((f) => f.followingId),
      ...incoming.map((f) => f.followerId),
    ]);
    friendIdSet.delete(req.user.id);

    const friends = await prisma.user.findMany({
      where: { id: { in: [...friendIdSet] } },
    });

    const results = await Promise.all(
      friends.map(async (u) => {
        const stats = await getUserStats(u.id);
        return formatUser(u, stats);
      })
    );

    res.json({ friends: results });
  } catch (err) {
    console.error("Friends list error:", err);
    res.status(500).json({ error: "Failed to fetch friends" });
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
