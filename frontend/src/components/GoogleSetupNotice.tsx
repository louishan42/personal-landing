import { AlertCircle, ExternalLink } from "lucide-react";

export default function GoogleSetupNotice() {
  return (
    <div className="rounded-xl border border-ape-gold/30 bg-ape-gold/5 p-5 text-left">
      <div className="mb-3 flex items-center gap-2 text-ape-gold">
        <AlertCircle size={18} />
        <span className="text-sm font-semibold">Google Sign-In not configured</span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted">
        The error <strong className="text-white">401: invalid_client</strong> means your Google
        OAuth Client ID is missing or still set to the placeholder. Follow these steps:
      </p>
      <ol className="mb-4 space-y-2 text-xs text-muted">
        <li>
          1. Open{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-ape-lime hover:underline"
          >
            Google Cloud Console <ExternalLink size={10} />
          </a>
        </li>
        <li>2. Create <strong className="text-white">OAuth client ID</strong> → Web application</li>
        <li>
          3. Add authorized origin:{" "}
          <code className="rounded bg-elevated px-1.5 py-0.5 text-ape-lime">
            {window.location.origin}
          </code>
        </li>
        <li>
          4. Paste Client ID into{" "}
          <code className="rounded bg-elevated px-1 text-ape-lime">frontend/.env</code> and{" "}
          <code className="rounded bg-elevated px-1 text-ape-lime">backend/.env</code>
        </li>
        <li>5. Restart both servers</li>
      </ol>
      <p className="text-[10px] text-muted">
        See <strong className="text-white">SETUP.md</strong> or <strong className="text-white">DEPLOY.md</strong> for full instructions.
      </p>
    </div>
  );
}
