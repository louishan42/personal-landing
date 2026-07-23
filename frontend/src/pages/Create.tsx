import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Create() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState(user?.location || "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [expTitle, setExpTitle] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const postMoment = async () => {
    if (!caption.trim() && !photoPreview) {
      setError("Add a photo or write something about your moment");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createMoment({
        caption: caption.trim(),
        location,
        type: photoPreview ? "photo" : "text",
        photos: photoPreview ? [photoPreview] : undefined,
      });
      await refreshUser();
      navigate("/");
    } catch {
      setError("Failed to post moment");
    } finally {
      setLoading(false);
    }
  };

  const saveExperience = async () => {
    if (!expTitle.trim()) {
      setError("Give your experience a title");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createExperience({ title: expTitle, description: expDesc });
      await refreshUser();
      setExpTitle("");
      setExpDesc("");
      navigate("/timeline");
    } catch {
      setError("Failed to save experience");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Create</h2>
        <p className="mt-1 text-sm text-muted">
          Capture what actually happened — not what looks good
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
          {error}
        </div>
      )}

      <section className="rounded-2xl glass p-6 shadow-card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ape-lime">
          Quick Moment
        </h3>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {photoPreview ? (
          <div className="relative mb-4 overflow-hidden rounded-xl">
            <img
              src={photoPreview}
              alt="Preview"
              className="aspect-video w-full object-cover"
            />
            <button
              onClick={clearPhoto}
              className="absolute right-2 top-2 rounded-full bg-void/80 p-1.5 text-white transition hover:bg-void"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-4 flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-elevated/40 transition hover:border-ape-lime/40 hover:bg-ape-lime/5"
          >
            <Camera size={32} className="text-muted" />
            <p className="mt-2 text-sm text-muted">Tap to add a photo</p>
          </button>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="What happened today? Coffee before class ☕"
          className="w-full resize-none rounded-xl border border-border bg-ink px-4 py-3 text-sm outline-none transition focus:border-ape-lime/50"
        />
        <div className="mt-3 flex items-center gap-2">
          <MapPin size={14} className="text-muted" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="flex-1 rounded-lg border border-border bg-ink px-3 py-2 text-sm outline-none focus:border-ape-lime/50"
          />
        </div>
        <button
          onClick={postMoment}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-ape-lime to-ape-emerald py-3 text-sm font-bold text-void transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post to Feed"}
        </button>
      </section>

      <section className="rounded-2xl glass p-6 shadow-card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ape-gold">
          Life Experience
        </h3>
        <input
          type="text"
          value={expTitle}
          onChange={(e) => setExpTitle(e.target.value)}
          placeholder="🌏 My Trip to Japan"
          className="mb-3 w-full rounded-xl border border-border bg-ink px-4 py-3 text-sm outline-none focus:border-ape-gold/50"
        />
        <textarea
          value={expDesc}
          onChange={(e) => setExpDesc(e.target.value)}
          rows={4}
          placeholder="Tell the story of this experience..."
          className="mb-3 w-full resize-none rounded-xl border border-border bg-ink px-4 py-3 text-sm outline-none focus:border-ape-gold/50"
        />
        <button
          onClick={saveExperience}
          disabled={loading}
          className="w-full rounded-xl border border-ape-gold/30 bg-ape-gold/10 py-3 text-sm font-semibold text-ape-gold transition hover:bg-ape-gold/20 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Experience"}
        </button>
      </section>
    </div>
  );
}
