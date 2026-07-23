const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.timelineEntry.findMany({
      where: { userId: req.user.id },
      orderBy: { entryDate: "desc" },
    });

    const grouped = {};
    for (const entry of entries) {
      const date = new Date(entry.entryDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: date.toLocaleString("en-US", { month: "long" }),
          year: date.getFullYear(),
          items: [],
        };
      }
      grouped[key].items.push({
        id: entry.id,
        emoji: entry.emoji,
        title: entry.title,
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    res.json({ timeline: Object.values(grouped) });
  } catch (err) {
    console.error("Timeline error:", err);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { emoji, title, entryDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const entry = await prisma.timelineEntry.create({
      data: {
        userId: req.user.id,
        emoji: emoji || "📌",
        title,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
      },
    });

    res.status(201).json({ entry });
  } catch (err) {
    console.error("Create timeline entry error:", err);
    res.status(500).json({ error: "Failed to create timeline entry" });
  }
});

router.get("/map", authMiddleware, async (req, res) => {
  try {
    const moments = await prisma.moment.findMany({
      where: { userId: req.user.id, location: { not: "" } },
      select: { location: true },
    });

    const locationCounts = {};
    for (const m of moments) {
      locationCounts[m.location] = (locationCounts[m.location] || 0) + 1;
    }

    const countries = Object.entries(locationCounts).map(([name, count]) => ({
      name,
      moments: count,
    }));

    res.json({ countries });
  } catch (err) {
    console.error("Map error:", err);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
});

module.exports = router;
