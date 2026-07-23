import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, type User, getToken } from "../api/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsSetup: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<void>;
  setupProfile: (data: {
    username: string;
    displayName?: string;
    location?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setNeedsSetup(false);
      return;
    }
    try {
      const { user: u } = await api.me();
      setUser(u);
      setNeedsSetup(!u.profileSetupComplete);
    } catch {
      localStorage.removeItem("lifeverse_token");
      setUser(null);
      setNeedsSetup(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const loginWithGoogle = async (credential: string) => {
    const { token, user: u, needsSetup: setup } = await api.googleLogin(credential);
    localStorage.setItem("lifeverse_token", token);
    setUser(u);
    setNeedsSetup(setup);
    return setup;
  };

  const adminLogin = async (email: string, password: string) => {
    const { token, user: u } = await api.adminLogin(email, password);
    localStorage.setItem("lifeverse_token", token);
    setUser(u);
    setNeedsSetup(false);
  };

  const setupProfile = async (data: {
    username: string;
    displayName?: string;
    location?: string;
  }) => {
    const { token, user: u } = await api.setupProfile(data);
    localStorage.setItem("lifeverse_token", token);
    setUser(u);
    setNeedsSetup(false);
  };

  const logout = () => {
    localStorage.removeItem("lifeverse_token");
    setUser(null);
    setNeedsSetup(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsSetup,
        loginWithGoogle,
        adminLogin,
        setupProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
