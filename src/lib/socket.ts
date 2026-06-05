import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

let channel: RealtimeChannel | null = null;

export const connectRealtime = (): RealtimeChannel => {
  if (channel) return channel;

  channel = supabase.channel("db-changes", {
    config: { broadcast: { self: true } },
  });

  return channel;
};

export const disconnectRealtime = (): void => {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
};

export const getChannel = (): RealtimeChannel | null => channel;
