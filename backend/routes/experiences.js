const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const experiences = await prisma.experience.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ experiences });
  } catch (err) {
    console.error("Experiences error:", err);
    res.status(500).json({ error: "Failed to fetch experiences" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, emoji } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const experience = await prisma.experience.create({
      data: {
        userId: req.user.id,
        title,
        description: description || "",
        emoji: emoji || "🌍",
      },
    });

    await prisma.timelineEntry.create({
      data: {
        userId: req.user.id,
        emoji: emoji || "🌍",
        title,
        entryDate: new Date(),
      },
    });

    res.status(201).json({ experience });
  } catch (err) {
    console.error("Create experience error:", err);
    res.status(500).json({ error: "Failed to create experience" });
  }
});

module.exports = router;
