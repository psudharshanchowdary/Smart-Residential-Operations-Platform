import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User } from "@/lib/types";
import { apiLogin, apiGetMe } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

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

  // On mount: restore session from localStorage token
  useEffect(() => {
    const savedToken = localStorage.getItem("apt_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    apiGetMe()
      .then((profile) => {
        const u: User = { ...profile, id: profile.id };
        setUser(u);
        setToken(savedToken);
        connectSocket(savedToken);
      })
      .catch(() => {
        localStorage.removeItem("apt_token");
        localStorage.removeItem("apt_user");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const { token: jwt, user: profile } = await apiLogin(email, password);
      const u: User = { ...profile, id: profile.id };

      localStorage.setItem("apt_token", jwt);
      localStorage.setItem("apt_user", JSON.stringify(u));

      setToken(jwt);
      setUser(u);

      // Connect socket and authenticate into user room
      connectSocket(jwt);

      return u;
    } catch (error) {
      console.error("Login failed:", error);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("apt_token");
    localStorage.removeItem("apt_user");
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
