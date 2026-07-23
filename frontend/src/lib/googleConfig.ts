export function getGoogleClientId(): string | null {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!id || id.includes("your-google-client-id") || id.includes("REPLACE_ME")) {
    return null;
  }
  return id;
}

export function isGoogleConfigured(): boolean {
  return getGoogleClientId() !== null;
}
