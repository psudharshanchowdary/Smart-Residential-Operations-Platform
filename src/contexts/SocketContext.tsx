import React, { createContext, useContext, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "./AuthContext";
import { getChannel } from "@/lib/socket";

interface SocketContextType {
  channel: RealtimeChannel | null;
}

const SocketContext = createContext<SocketContextType>({ channel: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user) {
      channelRef.current = getChannel();
    } else {
      channelRef.current = null;
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ channel: channelRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
