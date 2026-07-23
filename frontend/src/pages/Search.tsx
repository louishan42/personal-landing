import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, User as UserIcon, FileText } from "lucide-react";
import MomentCard from "../components/MomentCard";
import EmptyState from "../components/EmptyState";
import { api, ApiError, type Moment, type User as UserType } from "../api/client";

export default function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setUsers([]);
      setMoments([]);
      setSearched(false);
      setError("");
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .search(query.trim())
        .then(({ users: u, moments: m }) => {
          setUsers(u);
          setMoments(m);
          setSearched(true);
        })
        .catch((err) => {
          setUsers([]);
          setMoments([]);
          setSearched(true);
          setError(err instanceof ApiError ? err.message : "Search failed — is the backend running?");
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Search</h2>
        <p className="mt-1 text-sm text-muted">Find people and moments</p>
      </div>

      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username, caption, location..."
          className="w-full rounded-2xl border border-border bg-ink py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-ape-lime/50"
          autoFocus
        />
      </div>

      {error && (
        <div className="rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
        </div>
      )}

      {!loading && query.trim().length < 2 && (
        <EmptyState
          icon={SearchIcon}
          title="Start typing to search"
          description="Enter at least 2 characters to find users or moments."
        />
      )}

      {!loading && searched && users.length === 0 && moments.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title="No results"
          description={`Nothing found for "${query}"`}
        />
      )}

      {!loading && users.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted">
            <UserIcon size={14} /> People
          </h3>
          <div className="space-y-2">
            {users.map((u) => (
              <Link
                key={u.id}
                to={`/u/${u.username}`}
                className="flex items-center gap-4 rounded-2xl glass p-4 transition hover:shadow-glow-lime"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ape-lime/20 to-ape-emerald/20 text-sm font-bold">
                  {u.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{u.displayName}</p>
                  <p className="text-sm text-muted">@{u.username}</p>
                  {u.location && (
                    <p className="mt-0.5 text-xs text-muted">📍 {u.location}</p>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {u.stats.followers} followers
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && moments.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted">
            <FileText size={14} /> Moments
          </h3>
          <div className="space-y-4">
            {moments.map((m) => (
              <MomentCard key={m.id} moment={m} linkToDetail />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
