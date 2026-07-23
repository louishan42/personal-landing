const prisma = require("./prisma");

async function getFriendStatus(userId, otherId) {
  const outgoing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: userId, followingId: otherId },
    },
  });

  const incoming = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: otherId, followingId: userId },
    },
  });

  if (outgoing?.status === "ACCEPTED" && incoming?.status === "ACCEPTED") {
    return "FRIENDS";
  }
  if (incoming?.status === "PENDING") return "REQUEST_RECEIVED";
  if (outgoing?.status === "PENDING") return "REQUEST_SENT";
  return "NONE";
}

async function areFriends(userId, otherId) {
  return (await getFriendStatus(userId, otherId)) === "FRIENDS";
}

async function getFriendIds(userId) {
  const outgoing = await prisma.follow.findMany({
    where: { followerId: userId, status: "ACCEPTED" },
    select: { followingId: true },
  });

  const friendIds = [];
  for (const row of outgoing) {
    if (await areFriends(userId, row.followingId)) {
      friendIds.push(row.followingId);
    }
  }
  return friendIds;
}

module.exports = { getFriendStatus, areFriends, getFriendIds };
