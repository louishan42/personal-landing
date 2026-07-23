const prisma = require("../lib/prisma");

function formatUser(user, stats) {
  const avatar = user.avatarUrl
    ? null
    : user.displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    location: user.location,
    avatarUrl: user.avatarUrl,
    avatar: avatar || user.displayName.slice(0, 2).toUpperCase(),
    isAdmin: user.isAdmin || false,
    profileSetupComplete: user.profileSetupComplete ?? true,
    createdAt: user.createdAt,
    stats,
  };
}

async function getUserStats(userId) {
  const [
    followers,
    following,
    moments,
    experiences,
    timelineEntries,
    countries,
  ] = await Promise.all([
    prisma.follow.count({
      where: { followingId: userId, status: "ACCEPTED" },
    }),
    prisma.follow.count({
      where: { followerId: userId, status: "ACCEPTED" },
    }),
    prisma.moment.count({ where: { userId } }),
    prisma.experience.count({ where: { userId } }),
    prisma.timelineEntry.count({ where: { userId } }),
    prisma.moment.findMany({
      where: { userId, location: { not: "" } },
      select: { location: true },
      distinct: ["location"],
    }),
  ]);

  return {
    followers,
    following,
    moments,
    experiences,
    memories: moments,
    timelineEntries,
    countries: countries.length,
  };
}

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  bio: true,
  location: true,
  avatarUrl: true,
  isAdmin: true,
  profileSetupComplete: true,
  createdAt: true,
};

function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 20) {
    return "Username must be 3–20 characters";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  if (username.startsWith("_") || username.startsWith("pending_")) {
    return "Invalid username";
  }
  return null;
}

module.exports = { getUserStats, formatUser, USER_SELECT, validateUsername };
