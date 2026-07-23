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

    const followers = await prisma.follow.findMany({
      where: { followingId: req.user.id, status: "ACCEPTED" },
      select: { followerId: true },
    });

    const friendIds = new Set([
      req.user.id,
      ...following.map((f) => f.followingId),
      ...followers.map((f) => f.followerId),
    ]);

    const moments = await prisma.moment.findMany({
      where: { userId: { in: [...friendIds] } },
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
    const { caption, location, type, photos } = req.body;

    const hasPhotos = Array.isArray(photos) && photos.length > 0;
    const momentType = hasPhotos
      ? "PHOTO"
      : (type || "TEXT").toUpperCase();

    const moment = await prisma.moment.create({
      data: {
        userId: req.user.id,
        caption: caption || "",
        location: location || "",
        type: momentType,
        ...(hasPhotos && {
          media: {
            create: photos.slice(0, 4).map((url, order) => ({
              url,
              type: "image",
              order,
            })),
          },
        }),
      },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        media: { orderBy: { order: "asc" } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (caption || hasPhotos) {
      await prisma.timelineEntry.create({
        data: {
          userId: req.user.id,
          emoji: hasPhotos ? "📸" : "✍️",
          title: (caption || "Photo moment").slice(0, 100),
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

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        media: { orderBy: { order: "asc" } },
        comments: {
          include: {
            user: {
              select: { id: true, displayName: true, username: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!moment) {
      return res.status(404).json({ error: "Moment not found" });
    }

    const liked = await prisma.like.findUnique({
      where: {
        userId_momentId: { userId: req.user.id, momentId: moment.id },
      },
    });

    res.json({
      moment: {
        ...formatMoment(moment),
        liked: !!liked,
        commentList: moment.comments.map((c) => ({
          id: c.id,
          content: c.content,
          time: formatTimeAgo(c.createdAt),
          user: {
            id: c.user.id,
            name: c.user.displayName,
            username: c.user.username,
            avatar: c.user.displayName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          },
        })),
      },
    });
  } catch (err) {
    console.error("Get moment error:", err);
    res.status(500).json({ error: "Failed to fetch moment" });
  }
});

router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    const moment = await prisma.moment.findUnique({
      where: { id: req.params.id },
    });

    if (!moment) {
      return res.status(404).json({ error: "Moment not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user.id,
        momentId: moment.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, displayName: true, username: true },
        },
      },
    });

    if (moment.userId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: moment.userId,
          type: "COMMENT",
          content: `${req.user.displayName} commented on your moment`,
          relatedUserId: req.user.id,
          relatedMomentId: moment.id,
        },
      });
    }

    const count = await prisma.comment.count({ where: { momentId: moment.id } });

    res.status(201).json({
      comment: {
        id: comment.id,
        content: comment.content,
        time: "just now",
        user: {
          id: comment.user.id,
          name: comment.user.displayName,
          username: comment.user.username,
          avatar: comment.user.displayName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        },
      },
      comments: count,
    });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
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
