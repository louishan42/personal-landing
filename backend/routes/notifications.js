const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const relatedUserIds = [
      ...new Set(notifications.map((n) => n.relatedUserId).filter(Boolean)),
    ];

    const relatedUsers =
      relatedUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: relatedUserIds } },
            select: { id: true, username: true },
          })
        : [];

    const usernameById = Object.fromEntries(relatedUsers.map((u) => [u.id, u.username]));

    res.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type.toLowerCase(),
        text: n.content,
        time: formatTimeAgo(n.createdAt),
        read: n.read,
        relatedUserId: n.relatedUserId,
        relatedUsername: n.relatedUserId ? usernameById[n.relatedUserId] : null,
      })),
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (err) {
    console.error("Notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

module.exports = router;
