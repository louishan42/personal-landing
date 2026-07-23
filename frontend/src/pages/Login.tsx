import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { ApiError } from "../api/client";
import AuthHeader from "../components/AuthHeader";
import GoogleSetupNotice from "../components/GoogleSetupNotice";
import { getGoogleClientId } from "../lib/googleConfig";

export default function Login() {
  const { loginWithGoogle, user } = useAuth();
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState<string | null>(null);

  if (user && !redirect) {
    if (user.isAdmin) return <Navigate to="/admin" replace />;
    if (!user.profileSetupComplete) return <Navigate to="/setup-profile" replace />;
    return <Navigate to="/" replace />;
  }

  if (redirect) return <Navigate to={redirect} replace />;

  const clientId = getGoogleClientId();

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError("Google sign-in failed — no credential received");
      return;
    }
    setError("");
    try {
      const needsSetup = await loginWithGoogle(response.credential);
      setRedirect(needsSetup ? "/setup-profile" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="jungle-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <AuthHeader
          title={
            <>
              Life<span className="gradient-text">Verse</span>
            </>
          }
          subtitle="Sign in with your Gmail to continue"
        />

        <div className="rounded-2xl glass p-8 shadow-card">
          {error && (
            <div className="mb-4 rounded-xl bg-ape-coral/10 px-4 py-3 text-sm text-ape-coral">
              {error}
            </div>
          )}

          {!clientId ? (
            <GoogleSetupNotice />
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() =>
                  setError(
                    "Google sign-in failed. Check that your Client ID is correct and this URL is authorized in Google Cloud Console."
                  )
                }
                theme="filled_black"
                size="large"
                text="continue_with"
                shape="pill"
                width="320"
              />
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted">
            Only <strong className="text-white">@gmail.com</strong> accounts are accepted.
            <br />
            New here? Google Sign-In creates your account automatically.
          </p>

          <p className="mt-4 text-center text-xs text-muted">
            <Link to="/admin/login" className="text-ape-gold/70 hover:text-ape-gold">
              Admin login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
