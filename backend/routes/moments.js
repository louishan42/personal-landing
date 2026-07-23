const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.id, status: "ACCEPTED" },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(req.user.id);

    const moments = await prisma.moment.findMany({
      where: { userId: { in: followingIds } },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        media: { orderBy: { order: "asc" } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ moments: moments.map(formatMoment) });
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { caption, location, type } = req.body;

    const moment = await prisma.moment.create({
      data: {
        userId: req.user.id,
        caption: caption || "",
        location: location || "",
        type: (type || "TEXT").toUpperCase(),
      },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        media: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (caption) {
      await prisma.timelineEntry.create({
        data: {
          userId: req.user.id,
          emoji: "📸",
          title: caption.slice(0, 100),
          entryDate: new Date(),
        },
      });
    }

    res.status(201).json({ moment: formatMoment(moment) });
  } catch (err) {
    console.error("Create moment error:", err);
    res.status(500).json({ error: "Failed to create moment" });
  }
});

router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: req.params.id },
    });

    if (!moment) {
      return res.status(404).json({ error: "Moment not found" });
    }

    const existing = await prisma.like.findUnique({
      where: {
        userId_momentId: { userId: req.user.id, momentId: moment.id },
      },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { momentId: moment.id } });
      return res.json({ liked: false, likes: count });
    }

    await prisma.like.create({
      data: { userId: req.user.id, momentId: moment.id },
    });

    if (moment.userId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: moment.userId,
          type: "LIKE",
          content: `${req.user.displayName} liked your moment`,
          relatedUserId: req.user.id,
          relatedMomentId: moment.id,
        },
      });
    }

    const count = await prisma.like.count({ where: { momentId: moment.id } });
    res.json({ liked: true, likes: count });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Failed to like moment" });
  }
});

router.get("/explore", authMiddleware, async (req, res) => {
  try {
    const locations = await prisma.moment.groupBy({
      by: ["location"],
      where: { location: { not: "" } },
      _count: { location: true },
      orderBy: { _count: { location: "desc" } },
      take: 12,
    });

    res.json({
      locations: locations.map((l) => ({
        name: l.location,
        count: l._count.location,
      })),
    });
  } catch (err) {
    console.error("Explore error:", err);
    res.status(500).json({ error: "Failed to fetch explore data" });
  }
});

function formatMoment(m) {
  return {
    id: m.id,
    caption: m.caption,
    location: m.location,
    type: m.type.toLowerCase(),
    media: m.media,
    mediaCount: m.media?.length || 0,
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
