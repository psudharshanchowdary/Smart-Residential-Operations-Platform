import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maintenance_requests" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["requests"] });
          if (payload.eventType === "UPDATE") {
            toast({
              title: "🔧 Request Updated",
              description: `Status: ${payload.new.status}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "payments" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          toast({
            title: "💰 New Payment Request",
            description: `Amount: $${payload.new.amount}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["payments"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notices" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notices"] });
          toast({
            title: "📢 New Notice",
            description: payload.new.title,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notices" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notices"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["events"] });
          toast({
            title: "📅 New Community Event",
            description: `${payload.new.title} — ${payload.new.date}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["events"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "polls" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["polls"] });
          toast({
            title: "📊 New Poll",
            description: payload.new.question,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["polls"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["complaints"] });
          toast({
            title: "📩 New Complaint",
            description: payload.new.subject,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "complaints" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["complaints"] });
          toast({
            title: "📩 Complaint Updated",
            description: `Status: ${payload.new.status}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast]);
};
