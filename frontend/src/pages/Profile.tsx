import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Globe, Camera, Target, Sparkles } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { api, type Moment } from "../api/client";

export default function Profile() {
  const { user } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.username) return;
    api
      .getUserMoments(user.username)
      .then(({ moments: m }) => setMoments(m))
      .catch(() => setMoments([]))
      .finally(() => setLoading(false));
  }, [user?.username]);

  const stats = user?.stats;
  const tabs = [
    { to: "/profile", label: "Moments", emoji: "📸", active: true },
    { to: "/map", label: "Map", emoji: "🗺️" },
    { to: "/timeline", label: "Timeline", emoji: "📅" },
  ];

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl glass shadow-card">
        <div className="h-28 bg-gradient-to-r from-ape-jungle/40 via-ape-emerald/20 to-ape-lime/10" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-ape-lime to-ape-emerald text-2xl font-bold ring-4 ring-surface">
            {user.avatar}
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">{user.displayName}</h2>
          <p className="text-sm text-muted">@{user.username}</p>
          {user.location && (
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {user.location}
              </span>
            </p>
          )}
          {user.bio && <p className="mt-3 text-sm leading-relaxed">{user.bio}</p>}

          <div className="mt-4 flex gap-6 text-sm">
            <span>
              <strong className="text-white">{stats?.followers ?? 0}</strong>{" "}
              <span className="text-muted">Followers</span>
            </span>
            <span>
              <strong className="text-white">{stats?.following ?? 0}</strong>{" "}
              <span className="text-muted">Following</span>
            </span>
            <span>
              <strong className="text-white">{stats?.moments ?? 0}</strong>{" "}
              <span className="text-muted">Moments</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Globe, label: "Countries", value: stats?.countries ?? 0, color: "text-ape-sky" },
          { icon: Target, label: "Experiences", value: stats?.experiences ?? 0, color: "text-ape-gold" },
          { icon: Camera, label: "Memories", value: stats?.memories ?? 0, color: "text-ape-coral" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl glass p-4 text-center">
            <Icon size={20} className={`mx-auto ${color}`} />
            <p className="mt-2 font-display text-xl font-bold">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 rounded-xl bg-elevated/60 p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition ${
              tab.active
                ? "bg-ape-lime/15 text-ape-lime"
                : "text-muted hover:text-white"
            }`}
          >
            {tab.emoji} {tab.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      ) : moments.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No moments yet"
          description="Start capturing your life — every moment you post will appear here."
          action={
            <Link
              to="/create"
              className="rounded-xl bg-ape-lime/10 px-5 py-2.5 text-sm font-semibold text-ape-lime transition hover:bg-ape-lime/20"
            >
              Create your first moment
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {moments.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-border/40 bg-surface/60 p-4"
            >
              <p className="text-sm">{m.caption || "Untitled moment"}</p>
              <p className="mt-1 text-xs text-muted">
                {m.location && `${m.location} · `}
                {m.time}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
