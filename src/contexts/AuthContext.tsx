import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User } from "@/lib/types";
import { apiLogin, apiGetMe } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { connectRealtime, disconnectRealtime } from "@/lib/socket";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => null,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from Supabase
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await apiGetMe();
          const u: User = { ...profile, id: profile.id };
          setUser(u);
          setToken(session.access_token);
          connectRealtime();
        }
      } catch {
        // Session invalid or expired
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setToken(null);
          disconnectRealtime();
        } else if (event === "TOKEN_REFRESHED" && session) {
          setToken(session.access_token);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const { user: profile } = await apiLogin(email, password);
      const u: User = { ...profile, id: profile.id };

      setToken(profile.id); // Supabase manages the real token internally
      setUser(u);

      // Connect realtime channel
      connectRealtime();

      return u;
    } catch (error) {
      console.error("Login failed:", error);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    disconnectRealtime();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
