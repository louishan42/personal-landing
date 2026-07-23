const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: req.user.id },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, displayName: true, username: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    const conversations = await Promise.all(
      memberships.map(async (m) => {
        const other = m.conversation.members.find(
          (mem) => mem.userId !== req.user.id
        );
        const lastMsg = m.conversation.messages[0];

        const unread = await prisma.message.count({
          where: {
            conversationId: m.conversation.id,
            senderId: { not: req.user.id },
            readAt: null,
          },
        });

        return {
          id: m.conversation.id,
          user: other?.user.displayName || "Unknown",
          username: other?.user.username,
          avatar: (other?.user.displayName || "??")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          lastMessage: lastMsg?.content || "",
          time: lastMsg ? formatTimeAgo(lastMsg.createdAt) : "",
          unread: unread || undefined,
        };
      })
    );

    res.json({ conversations });
  } catch (err) {
    console.error("Conversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId: req.params.id,
        userId: req.user.id,
      },
    });

    if (!member) {
      return res.status(403).json({ error: "Not a member of this conversation" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: {
        sender: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.sender.displayName,
        isOwn: m.senderId === req.user.id,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("Messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId: req.params.id,
        userId: req.user.id,
      },
    });

    if (!member) {
      return res.status(403).json({ error: "Not a member of this conversation" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderId: req.user.id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, displayName: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.displayName,
        isOwn: true,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
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
