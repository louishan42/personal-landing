require("dotenv").config();

const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const momentRoutes = require("./routes/moments");
const timelineRoutes = require("./routes/timeline");
const experienceRoutes = require("./routes/experiences");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("⚠  ADMIN_EMAIL / ADMIN_PASSWORD not set — admin login disabled");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const username = "admin";

  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { isAdmin: true, passwordHash, profileSetupComplete: true },
    create: {
      email: email.toLowerCase(),
      username,
      passwordHash,
      displayName: "Admin",
      isAdmin: true,
      profileSetupComplete: true,
    },
  });

  console.log(`✓ Admin account ready: ${email}`);
}

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "LifeVerse API",
    version: "2",
    googleConfigured: !!(
      process.env.GOOGLE_CLIENT_ID &&
      !process.env.GOOGLE_CLIENT_ID.includes("your-google-client-id")
    ),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/moments", momentRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  try {
    await prisma.$connect();
    console.log("✓ Database connected");

    if (process.env.NODE_ENV === "production") {
      const { execSync } = require("child_process");
      try {
        console.log("Running prisma db push...");
        execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
        console.log("✓ Database schema synced");
      } catch (pushErr) {
        console.error("✗ prisma db push failed:", pushErr.message);
      }
    }

    await ensureAdminUser();
  } catch (err) {
    console.error("✗ Database connection failed:", err.message);
    console.error("  Set DATABASE_URL and run: npx prisma db push");
  }

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID.includes("your-google-client-id")
  ) {
    console.warn("⚠  GOOGLE_CLIENT_ID not configured — Google Sign-In will fail");
    console.warn("   See SETUP.md for Google OAuth setup instructions");
  }

  app.listen(PORT, () => {
    console.log(`LifeVerse backend running at http://localhost:${PORT}`);
  });
}

start();
