import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, AtSign, Bell, UserCheck } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { api, type Notification } from "../api/client";

const iconMap: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  like: { icon: Heart, color: "text-ape-coral", bg: "bg-ape-coral/10" },
  comment: { icon: MessageCircle, color: "text-ape-sky", bg: "bg-ape-sky/10" },
  follow: { icon: UserPlus, color: "text-ape-lime", bg: "bg-ape-lime/10" },
  message: { icon: MessageCircle, color: "text-ape-sky", bg: "bg-ape-sky/10" },
  tag: { icon: AtSign, color: "text-ape-gold", bg: "bg-ape-gold/10" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = () =>
    api
      .getNotifications()
      .then(({ notifications: n }) => {
        setNotifications(n);
        if (n.some((x) => !x.read)) {
          api.markNotificationsRead().catch(() => {});
        }
      })
      .catch(() => setNotifications([]));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleAccept = async (username: string, notificationId: string) => {
    setActingOn(notificationId);
    try {
      await api.acceptFriend(username);
      await load();
    } catch {
      /* ignore */
    } finally {
      setActingOn(null);
    }
  };

  const handleDecline = async (username: string, notificationId: string) => {
    setActingOn(notificationId);
    try {
      await api.rejectFriend(username);
      await load();
    } catch {
      /* ignore */
    } finally {
      setActingOn(null);
    }
  };

  const isFriendRequest = (n: Notification) =>
    n.type === "follow" && n.text.toLowerCase().includes("friend request");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-muted">Friend requests and activity updates</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All quiet for now"
          description="When someone sends a friend request or interacts with your moments, you'll see it here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = iconMap[n.type] || iconMap.like;
            const showAccept =
              isFriendRequest(n) && n.relatedUsername && !n.text.toLowerCase().includes("accepted");

            return (
              <div
                key={n.id}
                className={`rounded-2xl glass p-4 transition hover:shadow-glow-lime ${
                  !n.read ? "ring-1 ring-ape-lime/10" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                    <meta.icon size={18} className={meta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{n.text}</p>
                    <p className="text-xs text-muted">{n.time}</p>
                    {n.relatedUsername && (
                      <Link
                        to={`/u/${n.relatedUsername}`}
                        className="mt-1 inline-block text-xs text-ape-lime hover:underline"
                      >
                        View @{n.relatedUsername}
                      </Link>
                    )}
                    {showAccept && n.relatedUsername && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleAccept(n.relatedUsername!, n.id)}
                          disabled={actingOn === n.id}
                          className="flex items-center gap-1.5 rounded-lg bg-ape-lime px-3 py-1.5 text-xs font-bold text-void transition hover:opacity-90 disabled:opacity-50"
                        >
                          <UserCheck size={14} />
                          {actingOn === n.id ? "..." : "Accept Friend"}
                        </button>
                        <button
                          onClick={() => handleDecline(n.relatedUsername!, n.id)}
                          disabled={actingOn === n.id}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-ape-coral disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
