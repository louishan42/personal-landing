import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapPin, UserPlus, UserMinus, Camera, MessageCircle } from "lucide-react";
import MomentCard from "../components/MomentCard";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, type Moment, type User } from "../api/client";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [followStatus, setFollowStatus] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    if (username === currentUser?.username) {
      navigate("/profile", { replace: true });
      return;
    }

    Promise.all([api.getUser(username), api.getUserMoments(username)])
      .then(([profileRes, momentsRes]) => {
        setProfile(profileRes.user);
        setFollowStatus(profileRes.followStatus);
        setIsOwnProfile(profileRes.isOwnProfile);
        setMoments(momentsRes.moments);
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [username, currentUser?.username, navigate]);

  const handleFollow = async () => {
    if (!username || followLoading) return;
    setFollowLoading(true);
    setError("");
    try {
      if (followStatus === "ACCEPTED") {
        await api.unfollowUser(username);
        setFollowStatus(null);
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: Math.max(0, profile.stats.followers - 1),
            },
          });
        }
      } else {
        await api.followUser(username);
        setFollowStatus("ACCEPTED");
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: profile.stats.followers + 1,
            },
          });
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update friend status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!username || messageLoading) return;
    if (followStatus !== "ACCEPTED") {
      setError("Add them as a friend first to message");
      return;
    }
    setMessageLoading(true);
    setError("");
    try {
      const { conversation } = await api.startConversation(username);
      navigate(`/messages?chat=${conversation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start chat");
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl text-center py-24">
        <p className="text-muted">User not found</p>
        <Link to="/search" className="mt-4 inline-block text-sm text-ape-lime hover:underline">
          Search for people
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
          {error}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl glass shadow-card">
        <div className="h-28 bg-gradient-to-r from-ape-jungle/40 via-ape-emerald/20 to-ape-lime/10" />
        <div className="relative px-6 pb-6">
          <div className="flex items-end justify-between gap-3">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-ape-lime to-ape-emerald text-2xl font-bold ring-4 ring-surface">
              {profile.avatar}
            </div>
            {!isOwnProfile && (
              <div className="mb-1 flex gap-2">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    followStatus === "ACCEPTED"
                      ? "border border-border bg-elevated text-muted hover:border-ape-coral/50 hover:text-ape-coral"
                      : "bg-gradient-to-r from-ape-lime to-ape-emerald text-void hover:opacity-90"
                  }`}
                >
                  {followStatus === "ACCEPTED" ? (
                    <>
                      <UserMinus size={16} /> Friends
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Add Friend
                    </>
                  )}
                </button>
                {followStatus === "ACCEPTED" && (
                  <button
                    onClick={handleMessage}
                    disabled={messageLoading}
                    className="flex items-center gap-2 rounded-xl border border-ape-sky/30 bg-ape-sky/10 px-4 py-2.5 text-sm font-semibold text-ape-sky transition hover:bg-ape-sky/20 disabled:opacity-50"
                  >
                    <MessageCircle size={16} />
                    {messageLoading ? "..." : "Message"}
                  </button>
                )}
              </div>
            )}
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">{profile.displayName}</h2>
          <p className="text-sm text-muted">@{profile.username}</p>
          {profile.location && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted">
              <MapPin size={12} /> {profile.location}
            </p>
          )}
          {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}

          <div className="mt-4 flex gap-6 text-sm">
            <span>
              <strong className="text-white">{profile.stats.followers}</strong>{" "}
              <span className="text-muted">Friends</span>
            </span>
            <span>
              <strong className="text-white">{profile.stats.moments}</strong>{" "}
              <span className="text-muted">Moments</span>
            </span>
          </div>
        </div>
      </div>

      {followStatus !== "ACCEPTED" && !isOwnProfile && (
        <p className="rounded-xl bg-elevated/60 px-4 py-3 text-sm text-muted">
          Add <strong className="text-white">@{profile.username}</strong> as a friend to see their
          posts in your feed and message them.
        </p>
      )}

      {moments.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No moments yet"
          description={`@${profile.username} hasn't posted anything yet.`}
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted">
            Their posts
          </h3>
          {moments.map((m) => (
            <MomentCard key={m.id} moment={m} linkToDetail />
          ))}
        </div>
      )}
    </div>
  );
}
