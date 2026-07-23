import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Camera, MessageCircle, Globe, Trash2, LogOut, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, type AdminUser, ApiError } from "../api/client";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ users: 0, moments: 0, experiences: 0, messages: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([api.adminStats(), api.adminUsers()]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setStats((s) => ({ ...s, users: s.users - 1 }));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-void">
      <header className="border-b border-border/50 bg-surface/80 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={22} className="text-ape-gold" />
            <div>
              <h1 className="font-display text-lg font-bold">LifeVerse Admin</h1>
              <p className="text-xs text-muted">Logged in as {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-white"
            >
              View App
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ape-coral transition hover:bg-elevated"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-gold border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Users, label: "Users", value: stats.users, color: "text-ape-lime" },
                { icon: Camera, label: "Moments", value: stats.moments, color: "text-ape-sky" },
                {
                  icon: Globe,
                  label: "Experiences",
                  value: stats.experiences,
                  color: "text-ape-gold",
                },
                {
                  icon: MessageCircle,
                  label: "Messages",
                  value: stats.messages,
                  color: "text-ape-coral",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-2xl border border-border/50 bg-surface p-5">
                  <Icon size={20} className={color} />
                  <p className="mt-3 font-display text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/50 bg-surface">
              <div className="border-b border-border/50 px-6 py-4">
                <h2 className="font-display text-lg font-bold">All Users</h2>
                <p className="text-sm text-muted">{users.length} registered accounts</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-left text-xs text-muted">
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Username</th>
                      <th className="px-4 py-3 font-medium">Auth</th>
                      <th className="px-4 py-3 font-medium">Moments</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border/20 hover:bg-elevated/30">
                        <td className="px-6 py-4">
                          <p className="font-medium">{u.displayName}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          @{u.username}
                          {u.isAdmin && (
                            <span className="ml-2 rounded bg-ape-gold/20 px-1.5 py-0.5 text-[10px] text-ape-gold">
                              admin
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-muted">
                          {u.hasGoogle ? "Google" : "Password"}
                          {!u.profileSetupComplete && " · pending setup"}
                        </td>
                        <td className="px-4 py-4">{u.moments}</td>
                        <td className="px-4 py-4 text-xs text-muted">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          {!u.isAdmin && (
                            <button
                              onClick={() => deleteUser(u.id, u.displayName)}
                              className="rounded-lg p-2 text-muted transition hover:bg-ape-coral/10 hover:text-ape-coral"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
