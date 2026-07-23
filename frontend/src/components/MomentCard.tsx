import { Link } from "react-router-dom";
import { Heart, MessageCircle, MapPin, Play } from "lucide-react";
import type { Moment } from "../api/client";

export default function MomentCard({
  moment,
  onLike,
  linkToDetail = false,
}: {
  moment: Moment;
  onLike?: (id: string) => void;
  linkToDetail?: boolean;
}) {
  const firstPhoto = moment.media?.[0]?.url;
  const detailPath = `/moment/${moment.id}`;

  const header = (
    <div className="flex items-center gap-3 p-4">
      <Link
        to={`/u/${moment.user.username}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ape-lime/20 to-ape-emerald/20 text-xs font-bold ring-2 ring-ape-lime/10"
      >
        {moment.user.avatar}
      </Link>
      <div className="flex-1">
        <Link
          to={`/u/${moment.user.username}`}
          onClick={(e) => e.stopPropagation()}
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
  );

  const body = (
    <>
      {moment.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed">{moment.caption}</p>
      )}

      {(firstPhoto || moment.type === "video") && (
        <div className="relative mx-4 mb-4 overflow-hidden rounded-xl bg-elevated">
          {moment.type === "video" ? (
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-ink to-surface">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ape-lime/10 backdrop-blur-sm">
                <Play size={24} className="ml-1 text-ape-lime" fill="currentColor" />
              </div>
            </div>
          ) : firstPhoto ? (
            <img
              src={firstPhoto}
              alt={moment.caption || "Moment photo"}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : null}
        </div>
      )}
    </>
  );

  const footer = (
    <div className="flex items-center gap-6 border-t border-border/40 px-4 py-3">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLike?.(moment.id);
        }}
        className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ape-coral"
      >
        <Heart size={16} />
        {moment.likes}
      </button>
      {linkToDetail ? (
        <Link
          to={detailPath}
          className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ape-sky"
        >
          <MessageCircle size={16} />
          {moment.comments}
        </Link>
      ) : (
        <Link
          to={detailPath}
          className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ape-sky"
        >
          <MessageCircle size={16} />
          {moment.comments}
        </Link>
      )}
    </div>
  );

  if (linkToDetail) {
    return (
      <Link
        to={detailPath}
        className="animate-fade-up block overflow-hidden rounded-2xl border border-border/40 bg-surface/60 shadow-card transition hover:border-ape-lime/20"
      >
        {header}
        {body}
        <div onClick={(e) => e.preventDefault()}>{footer}</div>
      </Link>
    );
  }

  return (
    <article className="animate-fade-up overflow-hidden rounded-2xl border border-border/40 bg-surface/60 shadow-card">
      {header}
      {body}
      {footer}
    </article>
  );
}
