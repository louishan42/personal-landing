const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { getUserStats, formatUser } = require("../lib/userStats");
const { getFriendStatus, areFriends, getFriendIds } = require("../lib/friends");

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

    let friendStatus = "NONE";
    if (req.user.id !== user.id) {
      friendStatus = await getFriendStatus(req.user.id, user.id);
    }

    res.json({
      user: formatUser(user, stats),
      friendStatus,
      followStatus:
        friendStatus === "FRIENDS"
          ? "ACCEPTED"
          : friendStatus === "REQUEST_SENT"
            ? "PENDING"
            : null,
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
      return res.status(400).json({ error: "Cannot add yourself" });
    }

    const status = await getFriendStatus(req.user.id, target.id);
    if (status === "FRIENDS") {
      return res.status(409).json({ error: "Already friends" });
    }
    if (status === "REQUEST_SENT") {
      return res.status(409).json({ error: "Friend request already sent" });
    }
    if (status === "REQUEST_RECEIVED") {
      return res.status(400).json({ error: "They already sent you a request — accept it instead" });
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
        content: `${req.user.displayName} sent you a friend request`,
        relatedUserId: req.user.id,
      },
    });

    res.status(201).json({ status: "PENDING", friendStatus: "REQUEST_SENT" });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

router.post("/:username/friend/accept", authMiddleware, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const incoming = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: target.id,
          followingId: req.user.id,
        },
      },
    });

    if (!incoming || incoming.status !== "PENDING") {
      return res.status(404).json({ error: "No pending friend request from this user" });
    }

    await prisma.follow.update({
      where: { id: incoming.id },
      data: { status: "ACCEPTED" },
    });

    const outgoing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: target.id,
        },
      },
    });

    if (outgoing) {
      await prisma.follow.update({
        where: { id: outgoing.id },
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

    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "FOLLOW",
        content: `${req.user.displayName} accepted your friend request`,
        relatedUserId: req.user.id,
      },
    });

    res.json({ status: "ACCEPTED", friendStatus: "FRIENDS" });
  } catch (err) {
    console.error("Accept friend error:", err);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
});

router.post("/:username/friend/reject", authMiddleware, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: target.id,
        followingId: req.user.id,
        status: "PENDING",
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: "No pending friend request from this user" });
    }

    res.json({ status: "NONE", friendStatus: "NONE" });
  } catch (err) {
    console.error("Reject friend error:", err);
    res.status(500).json({ error: "Failed to decline friend request" });
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

    res.json({ status: "NONE", friendStatus: "NONE" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

router.get("/friends/list", authMiddleware, async (req, res) => {
  try {
    const friendIds = await getFriendIds(req.user.id);

    const friends = await prisma.user.findMany({
      where: { id: { in: friendIds } },
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

    const isOwn = req.user.id === user.id;
    const friends = isOwn || (await areFriends(req.user.id, user.id));

    if (!friends) {
      return res.json({ moments: [], locked: true });
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
