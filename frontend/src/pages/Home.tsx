import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, Sparkles } from "lucide-react";
import MomentCard from "../components/MomentCard";
import EmptyState from "../components/EmptyState";
import { api, type Moment } from "../api/client";

export default function Home() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFeed()
      .then(({ moments: m }) => setMoments(m))
      .catch(() => setMoments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (id: string) => {
    try {
      const { likes } = await api.likeMoment(id);
      setMoments((prev) =>
        prev.map((m) => (m.id === id ? { ...m, likes } : m))
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-ape-lime/10 bg-gradient-to-br from-ape-jungle/20 via-surface to-void p-8">
        <h2 className="font-display text-2xl font-bold md:text-3xl">
          What's happening in your life?
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          Your personal life journal — not a highlight reel. Share real moments as they happen.
        </p>
        <Link
          to="/create"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ape-lime to-ape-emerald px-5 py-2.5 text-sm font-bold text-void transition hover:opacity-90"
        >
          <PenLine size={16} />
          Capture a moment
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      ) : moments.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Your feed is empty"
          description="Follow friends or post your first moment to start building your life story."
          action={
            <Link
              to="/create"
              className="rounded-xl bg-ape-lime/10 px-5 py-2.5 text-sm font-semibold text-ape-lime transition hover:bg-ape-lime/20"
            >
              Post your first moment
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {moments.map((moment, i) => (
            <div key={moment.id} style={{ animationDelay: `${i * 0.1}s` }}>
              <MomentCard moment={moment} onLike={handleLike} linkToDetail />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
