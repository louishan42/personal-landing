import { Heart, MessageCircle, Share2, MapPin, Play } from "lucide-react";
import type { Moment } from "../api/client";

export default function MomentCard({
  moment,
  onLike,
}: {
  moment: Moment;
  onLike?: (id: string) => void;
}) {
  return (
    <article className="animate-fade-up overflow-hidden rounded-2xl border border-border/40 bg-surface/60 shadow-card">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ape-lime/20 to-ape-emerald/20 text-xs font-bold ring-2 ring-ape-lime/10">
          {moment.user.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{moment.user.name}</p>
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

      {moment.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed">{moment.caption}</p>
      )}

      {moment.type !== "text" && (
        <div className="relative mx-4 mb-4 overflow-hidden rounded-xl bg-elevated">
          {moment.type === "video" ? (
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-ink to-surface">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ape-lime/10 backdrop-blur-sm">
                <Play size={24} className="ml-1 text-ape-lime" fill="currentColor" />
              </div>
            </div>
          ) : moment.mediaCount > 0 ? (
            <div className="aspect-[16/9] bg-gradient-to-br from-ape-jungle/30 to-ape-emerald/10" />
          ) : null}
        </div>
      )}

      <div className="flex items-center gap-6 border-t border-border/40 px-4 py-3">
        <button
          onClick={() => onLike?.(moment.id)}
          className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ape-coral"
        >
          <Heart size={16} />
          {moment.likes}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ape-sky">
          <MessageCircle size={16} />
          {moment.comments}
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-sm text-muted transition hover:text-white">
          <Share2 size={16} />
        </button>
      </div>
    </article>
  );
}
