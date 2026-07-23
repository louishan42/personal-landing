import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Check, X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../api/client";
import AuthHeader from "../components/AuthHeader";

export default function SetupProfile() {
  const { user, needsSetup, setupProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState("");

  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailable(null);
      setCheckError("");
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await api.checkUsername(username);
        setAvailable(result.available);
        setCheckError(result.error || "");
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  if (!user) return <Navigate to="/login" replace />;
  if (!needsSetup && user.profileSetupComplete) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available) return;

    setError("");
    setLoading(true);
    try {
      await setupProfile({ username, displayName, location });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jungle-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AuthHeader
          title={<>Choose your username</>}
          subtitle="This is how others will find you on LifeVerse"
        />

        <form onSubmit={handleSubmit} className="rounded-2xl glass p-8 shadow-card">
          {error && (
            <div className="mb-4 rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full rounded-xl border border-border bg-ink px-4 py-3 pr-10 text-sm outline-none focus:border-ape-lime/50"
                  placeholder="yourname"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking && <Loader2 size={16} className="animate-spin text-muted" />}
                  {!checking && available === true && (
                    <Check size={16} className="text-ape-lime" />
                  )}
                  {!checking && available === false && <X size={16} className="text-ape-coral" />}
                </span>
              </div>
              {checkError && <p className="mt-1 text-xs text-ape-coral">{checkError}</p>}
              {!checkError && available === false && (
                <p className="mt-1 text-xs text-ape-coral">Username is already taken</p>
              )}
              {!checkError && available === true && (
                <p className="mt-1 text-xs text-ape-lime">Username is available</p>
              )}
              <p className="mt-1 text-xs text-muted">3–20 chars, letters, numbers, underscores only</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-border bg-ink px-4 py-3 text-sm outline-none focus:border-ape-lime/50"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-border bg-ink px-4 py-3 text-sm outline-none focus:border-ape-lime/50"
                placeholder="City (optional)"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !available || checking}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-ape-lime to-ape-emerald py-3 text-sm font-bold text-void transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to LifeVerse"}
          </button>
        </form>
      </div>
    </div>
  );
}
