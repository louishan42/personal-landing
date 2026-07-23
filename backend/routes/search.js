const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { formatUser, getUserStats } = require("../lib/userStats");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.json({ users: [], moments: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        profileSetupComplete: true,
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
    });

    const userResults = await Promise.all(
      users.map(async (u) => {
        const stats = await getUserStats(u.id);
        return formatUser(u, stats);
      })
    );

    const moments = await prisma.moment.findMany({
      where: {
        OR: [
          { caption: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        media: { orderBy: { order: "asc" } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      users: userResults,
      moments: moments.map(formatMoment),
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
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
