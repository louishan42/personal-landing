import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Send } from "lucide-react";
import { api, type Moment } from "../api/client";

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getMoment(id)
      .then(({ moment: m }) => setMoment(m))
      .catch(() => setMoment(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!moment) return;
    try {
      const { likes } = await api.likeMoment(moment.id);
      setMoment({ ...moment, likes, liked: !moment.liked });
    } catch {
      /* ignore */
    }
  };

  const handleComment = async () => {
    if (!moment || !comment.trim()) return;
    setSubmitting(true);
    try {
      const { comment: c, comments } = await api.commentMoment(moment.id, comment.trim());
      setMoment({
        ...moment,
        comments,
        commentList: [...(moment.commentList || []), c],
      });
      setComment("");
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ape-lime border-t-transparent" />
      </div>
    );
  }

  if (!moment) {
    return (
      <div className="mx-auto max-w-xl text-center py-24">
        <p className="text-muted">Moment not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-ape-lime hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const firstPhoto = moment.media?.[0]?.url;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted transition hover:text-white"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <article className="overflow-hidden rounded-2xl border border-border/40 bg-surface/60 shadow-card">
        <div className="flex items-center gap-3 p-4">
          <Link
            to={`/u/${moment.user.username}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ape-lime/20 to-ape-emerald/20 text-xs font-bold ring-2 ring-ape-lime/10"
          >
            {moment.user.avatar}
          </Link>
          <div className="flex-1">
            <Link
              to={`/u/${moment.user.username}`}
              className="text-sm font-semibold hover:text-ape-lime"
            >
              {moment.user.name}
            </Link>
            <p className="flex items-center gap-1 text-xs text-muted">
              {moment.location && (
                <>
                  <MapPin size={10} />
                  {moment.location} ·{" "}
                </>
              )}
              {moment.time}
            </p>
          </div>
        </div>

        {firstPhoto && (
          <div className="px-4 pb-4">
            <img
              src={firstPhoto}
              alt={moment.caption || "Moment photo"}
              className="w-full rounded-xl object-cover"
            />
          </div>
        )}

        {moment.caption && (
          <p className="px-4 pb-4 text-sm leading-relaxed">{moment.caption}</p>
        )}

        <div className="flex items-center gap-6 border-t border-border/40 px-4 py-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition ${
              moment.liked ? "text-ape-coral" : "text-muted hover:text-ape-coral"
            }`}
          >
            <Heart size={16} fill={moment.liked ? "currentColor" : "none"} />
            {moment.likes}
          </button>
          <span className="text-sm text-muted">{moment.comments} comments</span>
        </div>
      </article>

      <section className="rounded-2xl glass p-4">
        <h3 className="mb-4 text-sm font-semibold">Comments</h3>

        {(moment.commentList?.length ?? 0) === 0 ? (
          <p className="mb-4 text-sm text-muted">No comments yet. Be the first!</p>
        ) : (
          <div className="mb-4 space-y-3">
            {moment.commentList?.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-bold">
                  {c.user.avatar}
                </div>
                <div className="min-w-0 flex-1 rounded-xl bg-elevated/60 px-3 py-2">
                  <p className="text-xs font-semibold">
                    <Link to={`/u/${c.user.username}`} className="hover:text-ape-lime">
                      {c.user.name}
                    </Link>
                    <span className="ml-2 font-normal text-muted">{c.time}</span>
                  </p>
                  <p className="mt-1 text-sm">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Write a comment..."
            className="flex-1 rounded-xl border border-border bg-ink px-4 py-2.5 text-sm outline-none focus:border-ape-lime/50"
          />
          <button
            onClick={handleComment}
            disabled={submitting || !comment.trim()}
            className="flex items-center justify-center rounded-xl bg-ape-lime px-4 text-void transition hover:opacity-90 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
