const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { USER_SELECT } = require("../lib/userStats");

const JWT_SECRET = process.env.JWT_SECRET || "lifeverse-dev-secret-change-in-production";

function signToken(userId, isAdmin = false) {
  return jwt.sign({ userId, isAdmin }, JWT_SECRET, { expiresIn: "7d" });
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: USER_SELECT,
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function adminMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: USER_SELECT,
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware, adminMiddleware, signToken, JWT_SECRET };
