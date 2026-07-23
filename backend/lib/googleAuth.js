const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(credential) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

function isGmailEmail(email) {
  return email.toLowerCase().endsWith("@gmail.com");
}

async function generateUsername(prisma, email, name) {
  const base = (email.split("@")[0] || name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";

  let username = base;
  let attempt = 0;

  while (attempt < 10) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) return username;
    attempt += 1;
    username = `${base}${attempt}`;
  }

  return `${base}${Date.now().toString(36).slice(-4)}`;
}

function dbErrorMessage(err) {
  if (err.code === "P1001" || err.message?.includes("Can't reach database")) {
    return "Database is not running. Start PostgreSQL: docker compose up -d && cd backend && npx prisma db push";
  }
  if (err.code === "P2021" || err.code === "P2022") {
    return "Database tables missing. Run: cd backend && npx prisma db push";
  }
  return null;
}

module.exports = {
  verifyGoogleToken,
  isGmailEmail,
  generateUsername,
  dbErrorMessage,
};
