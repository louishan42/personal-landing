import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { api } from "../api/client";

const categories = [
  { emoji: "✈️", label: "Travel" },
  { emoji: "🍜", label: "Food" },
  { emoji: "⚽", label: "Sports" },
  { emoji: "🎵", label: "Music" },
  { emoji: "📚", label: "Learning" },
  { emoji: "🏔️", label: "Adventure" },
  { emoji: "👨‍👩‍👧", label: "Family" },
  { emoji: "💼", label: "Work" },
];

export default function Explore() {
  const [locations, setLocations] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .explore()
      .then(({ locations: l }) => setLocations(l))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Explore</h2>
        <p className="mt-1 text-sm text-muted">
          Discover public moments from around the world
        </p>
      </div>

      <section>
        <h3 className="mb-4 font-semibold">Trending Locations</h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
          </div>
        ) : locations.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No locations yet"
            description="As people post moments with locations, trending places will appear here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {locations.map((loc) => (
              <div
                key={loc.name}
                className="group relative overflow-hidden rounded-2xl glass p-5 text-left transition hover:shadow-glow-lime"
              >
                <span className="text-3xl">📍</span>
                <p className="mt-3 font-semibold group-hover:gradient-text">{loc.name}</p>
                <p className="text-xs text-muted">
                  {loc.count} public moment{loc.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-4 font-semibold">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(({ emoji, label }) => (
            <button
              key={label}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-elevated/50 px-4 py-2 text-sm transition hover:border-ape-lime/40 hover:bg-ape-lime/10"
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
