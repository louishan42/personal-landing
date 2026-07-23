import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Globe } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { api } from "../api/client";

export default function LifeMap() {
  const [countries, setCountries] = useState<{ name: string; moments: number }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMap()
      .then(({ countries: c }) => {
        setCountries(c);
        if (c.length > 0) setSelected(c[0].name);
      })
      .catch(() => setCountries([]))
      .finally(() => setLoading(false));
  }, []);

  const country = countries.find((c) => c.name === selected);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Life Map</h2>
        <p className="mt-1 text-sm text-muted">
          Every moment with a location builds your personal world map
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      ) : countries.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Your map is empty"
          description="Post moments with locations to see them appear on your life map."
          action={
            <Link
              to="/create"
              className="rounded-xl bg-ape-lime/10 px-5 py-2.5 text-sm font-semibold text-ape-lime transition hover:bg-ape-lime/20"
            >
              Add a moment with location
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            {countries.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelected(c.name)}
                className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${
                  selected === c.name
                    ? "glass shadow-glow-lime ring-1 ring-ape-lime/30"
                    : "hover:bg-elevated/60"
                }`}
              >
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.moments} moment{c.moments !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4 lg:col-span-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl glass shadow-card">
              <div className="absolute inset-0 bg-gradient-to-br from-ape-jungle/20 via-surface to-void" />
              {countries.map((c, i) => (
                <span
                  key={c.name}
                  className={`absolute h-3 w-3 animate-pulse-soft rounded-full shadow-lg ${
                    selected === c.name ? "bg-ape-lime" : "bg-ape-emerald/50"
                  }`}
                  style={{
                    top: `${20 + (i * 15) % 60}%`,
                    left: `${15 + (i * 23) % 70}%`,
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted/60">Interactive map coming soon</p>
              </div>
            </div>

            {country && (
              <div className="rounded-2xl glass p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📍</span>
                  <div>
                    <h3 className="font-display text-xl font-bold">{country.name}</h3>
                    <p className="text-sm text-muted">
                      {country.moments} memor{country.moments !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted">
                  <MapPin size={10} className="text-ape-lime" />
                  Locations from your moments
                </div>
                <Link
                  to="/timeline"
                  className="mt-4 block w-full rounded-xl bg-ape-lime/15 py-2.5 text-center text-sm font-semibold text-ape-lime transition hover:bg-ape-lime/25"
                >
                  View Timeline
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
