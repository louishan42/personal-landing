import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { api, type TimelineGroup } from "../api/client";

export default function Timeline() {
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTimeline()
      .then(({ timeline: t }) => setTimeline(t))
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Life Timeline</h2>
        <p className="mt-1 text-sm text-muted">
          Your entire life story — not just posts, but your journey
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      ) : timeline.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Your timeline is blank"
          description="Save life experiences or post moments to start building your personal timeline."
          action={
            <Link
              to="/create"
              className="rounded-xl bg-ape-lime/10 px-5 py-2.5 text-sm font-semibold text-ape-lime transition hover:bg-ape-lime/20"
            >
              Add your first experience
            </Link>
          }
        />
      ) : (
        <div className="relative space-y-8 pl-6">
          <div className="absolute bottom-0 left-[11px] top-0 w-px bg-gradient-to-b from-ape-lime via-ape-emerald to-transparent" />

          {timeline.map((group) => (
            <section key={`${group.year}-${group.month}`}>
              <div className="relative mb-4">
                <span className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full bg-ape-lime text-[10px] font-bold text-void ring-4 ring-void">
                  {group.month.slice(0, 1)}
                </span>
                <h3 className="font-display text-lg font-bold">
                  {group.month}{" "}
                  <span className="text-sm font-normal text-muted">{group.year}</span>
                </h3>
              </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl glass p-4 transition hover:shadow-glow-lime"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
