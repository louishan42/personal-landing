import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapPin, UserPlus, UserMinus, Camera, MessageCircle, UserCheck, Clock } from "lucide-react";
import MomentCard from "../components/MomentCard";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, type FriendStatus, type Moment, type User } from "../api/client";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("NONE");
  const [momentsLocked, setMomentsLocked] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    if (!username) return;
    const [profileRes, momentsRes] = await Promise.all([
      api.getUser(username),
      api.getUserMoments(username),
    ]);
    setProfile(profileRes.user);
    setFriendStatus(profileRes.friendStatus);
    setIsOwnProfile(profileRes.isOwnProfile);
    setMoments(momentsRes.moments);
    setMomentsLocked(!!momentsRes.locked);
  };

  useEffect(() => {
    if (!username) return;
    if (username === currentUser?.username) {
      navigate("/profile", { replace: true });
      return;
    }

    loadProfile()
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username, currentUser?.username, navigate]);

  const handleAddFriend = async () => {
    if (!username || actionLoading) return;
    setActionLoading(true);
    setError("");
    try {
      const { friendStatus: status } = await api.followUser(username);
      setFriendStatus(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!username || actionLoading) return;
    setActionLoading(true);
    setError("");
    try {
      const { friendStatus: status } = await api.acceptFriend(username);
      setFriendStatus(status);
      await loadProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to accept request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!username || actionLoading) return;
    setActionLoading(true);
    setError("");
    try {
      const { friendStatus: status } = await api.rejectFriend(username);
      setFriendStatus(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to decline request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!username || actionLoading) return;
    setActionLoading(true);
    setError("");
    try {
      await api.unfollowUser(username);
      setFriendStatus("NONE");
      setMoments([]);
      setMomentsLocked(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove friend");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!username || actionLoading) return;
    setActionLoading(true);
    setError("");
    try {
      await api.unfollowUser(username);
      setFriendStatus("NONE");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!username || messageLoading) return;
    if (friendStatus !== "FRIENDS") {
      setError("You must be friends to message each other");
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
        <div className="rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">{error}</div>
      )}

      <div className="relative overflow-hidden rounded-3xl glass shadow-card">
        <div className="h-28 bg-gradient-to-r from-ape-jungle/40 via-ape-emerald/20 to-ape-lime/10" />
        <div className="relative px-6 pb-6">
          <div className="flex items-end justify-between gap-3">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-ape-lime to-ape-emerald text-2xl font-bold ring-4 ring-surface">
              {profile.avatar}
            </div>
            {!isOwnProfile && (
              <div className="mb-1 flex flex-wrap justify-end gap-2">
                {friendStatus === "NONE" && (
                  <button
                    onClick={handleAddFriend}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-ape-lime to-ape-emerald px-4 py-2.5 text-sm font-semibold text-void transition hover:opacity-90 disabled:opacity-50"
                  >
                    <UserPlus size={16} /> Add Friend
                  </button>
                )}
                {friendStatus === "REQUEST_SENT" && (
                  <button
                    onClick={handleCancelRequest}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-semibold text-muted transition hover:text-ape-coral disabled:opacity-50"
                  >
                    <Clock size={16} /> Request Sent
                  </button>
                )}
                {friendStatus === "REQUEST_RECEIVED" && (
                  <>
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-ape-lime to-ape-emerald px-4 py-2.5 text-sm font-semibold text-void transition hover:opacity-90 disabled:opacity-50"
                    >
                      <UserCheck size={16} /> Accept Friend
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-semibold text-muted transition hover:text-ape-coral disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </>
                )}
                {friendStatus === "FRIENDS" && (
                  <>
                    <button
                      onClick={handleUnfriend}
                      disabled={actionLoading}
                      className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-ape-coral/50 hover:text-ape-coral disabled:opacity-50"
                    >
                      <UserMinus size={16} /> Friends
                    </button>
                    <button
                      onClick={handleMessage}
                      disabled={messageLoading}
                      className="flex items-center gap-2 rounded-xl border border-ape-sky/30 bg-ape-sky/10 px-4 py-2.5 text-sm font-semibold text-ape-sky transition hover:bg-ape-sky/20 disabled:opacity-50"
                    >
                      <MessageCircle size={16} />
                      {messageLoading ? "..." : "Message"}
                    </button>
                  </>
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
        </div>
      </div>

      {friendStatus !== "FRIENDS" && !isOwnProfile && (
        <p className="rounded-xl bg-elevated/60 px-4 py-3 text-sm text-muted">
          {friendStatus === "REQUEST_SENT" && (
            <>
              Waiting for <strong className="text-white">@{profile.username}</strong> to accept your
              friend request. Their posts stay hidden until then.
            </>
          )}
          {friendStatus === "REQUEST_RECEIVED" && (
            <>
              <strong className="text-white">@{profile.username}</strong> wants to be friends. Tap{" "}
              <strong className="text-ape-lime">Accept Friend</strong> to see each other's posts.
            </>
          )}
          {friendStatus === "NONE" && (
            <>
              Send a friend request to <strong className="text-white">@{profile.username}</strong>.
              Once they accept, you'll see each other's posts and can message.
            </>
          )}
        </p>
      )}

      {momentsLocked ? (
        <EmptyState
          icon={Camera}
          title="Posts are private"
          description="Become friends to see what they post."
        />
      ) : moments.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No moments yet"
          description={`@${profile.username} hasn't posted anything yet.`}
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted">Their posts</h3>
          {moments.map((m) => (
            <MomentCard key={m.id} moment={m} linkToDetail />
          ))}
        </div>
      )}
    </div>
  );
}
