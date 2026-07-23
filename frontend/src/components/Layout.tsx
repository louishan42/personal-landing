import { NavLink } from "react-router-dom";
import {
  Bell,
  Compass,
  Home,
  Map,
  MessageCircle,
  Plus,
  User,
  Calendar,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { api } from "../api/client";

const mainNav = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/create", icon: Plus, label: "Create" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

const lifeNav = [
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/timeline", icon: Calendar, label: "Timeline" },
  { to: "/map", icon: Map, label: "Life Map" },
];

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "bg-ape-lime/10 text-ape-lime shadow-glow-lime"
            : "text-muted hover:bg-elevated hover:text-white"
        }`
      }
    >
      <Icon size={18} />
      <span className="hidden lg:inline flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ape-coral px-1.5 text-[10px] font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.getNotifications().then(({ unreadCount: c }) => setUnreadCount(c)).catch(() => {});
  }, []);

  return (
    <div className="jungle-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border/50 glass md:flex">
          <div className="border-b border-border/50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ape-lime to-ape-emerald font-display text-sm font-bold text-void shadow-glow-lime">
                LV
              </div>
              <div>
                <h1 className="font-display text-lg font-bold tracking-tight">
                  Life<span className="gradient-text">Verse</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-muted">
                  Your universe. Your story.
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Main
            </p>
            {mainNav.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                badge={item.to === "/notifications" ? unreadCount : undefined}
              />
            ))}

            <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Your Life
            </p>
            {lifeNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-elevated/60 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ape-lime/30 to-ape-emerald/30 text-xs font-bold">
                {user?.avatar || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.displayName}</p>
                <p className="truncate text-xs text-muted">
                  {user?.location ? `📍 ${user.location}` : `@${user?.username}`}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-ape-coral"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col pb-20 md:pb-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 glass px-4 py-3 md:hidden">
            <h1 className="font-display text-xl font-bold">
              Life<span className="gradient-text">Verse</span>
            </h1>
            <NavLink
              to="/notifications"
              className="relative rounded-lg p-2 text-muted hover:bg-elevated hover:text-white"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ape-coral text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border/50 glass px-2 py-2 md:hidden">
        {mainNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${
                isActive ? "text-ape-lime" : "text-muted"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
