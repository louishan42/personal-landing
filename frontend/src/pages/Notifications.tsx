import { useEffect, useState } from "react";
import { Heart, MessageCircle, UserPlus, AtSign, Bell } from "lucide-react";
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

  useEffect(() => {
    api
      .getNotifications()
      .then(({ notifications: n }) => {
        setNotifications(n);
        if (n.some((x) => !x.read)) {
          api.markNotificationsRead().catch(() => {});
        }
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-muted">Stay updated on your life's activity</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All quiet for now"
          description="When someone interacts with your moments or sends a follow request, you'll see it here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = iconMap[n.type] || iconMap.like;
            return (
              <div
                key={n.id}
                className={`flex items-center gap-4 rounded-2xl glass p-4 transition hover:shadow-glow-lime ${
                  !n.read ? "ring-1 ring-ape-lime/10" : ""
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bg}`}>
                  <meta.icon size={18} className={meta.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-muted">{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
