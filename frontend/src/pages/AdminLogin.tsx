import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const { adminLogin, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ape-gold/10">
            <Shield size={28} className="text-ape-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-sm text-muted">Password login for administrators only</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-ape-gold/20 bg-surface p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Admin email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-ink px-4 py-3 text-sm outline-none focus:border-ape-gold/50"
                placeholder="admin@gmail.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-ink px-4 py-3 text-sm outline-none focus:border-ape-gold/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-ape-gold py-3 text-sm font-bold text-void transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/login" className="text-ape-lime hover:underline">
              ← Back to user login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
