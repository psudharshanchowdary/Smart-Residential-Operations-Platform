import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onRequestUpdated = (data: { requestId: string; status: string; adminNote?: string; title: string }) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "🔧 Request Updated", description: `"${data.title}" is now ${data.status}${data.adminNote ? ` — ${data.adminNote}` : ""}` });
    };

    const onPaymentCreated = (data: { payment: { amount: number; description: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "💰 New Payment Request", description: `$${data.payment.amount.toLocaleString()} due — ${data.payment.description}` });
    };

    const onNoticeCreated = (data: { notice: { title: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast({ title: "📢 New Notice", description: data.notice.title });
    };

    const onEventCreated = (data: { event: { title: string; date: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "📅 New Community Event", description: `${data.event.title} on ${data.event.date}` });
    };

    const onPollCreated = (data: { poll: { question: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      toast({ title: "📊 New Poll", description: data.poll.question });
    };

    const onComplaintCreated = (data: { complaint: { subject: string; userName: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast({ title: "📩 New Complaint", description: `${data.complaint.userName}: ${data.complaint.subject}` });
    };

    const onComplaintUpdated = (data: { complaint: { subject: string; status: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast({ title: "📩 Complaint Updated", description: `"${data.complaint.subject}" → ${data.complaint.status}` });
    };

    socket.on("request:updated", onRequestUpdated);
    socket.on("payment:created", onPaymentCreated);
    socket.on("notice:created", onNoticeCreated);
    socket.on("event:created", onEventCreated);
    socket.on("poll:created", onPollCreated);
    socket.on("complaint:created", onComplaintCreated);
    socket.on("complaint:updated", onComplaintUpdated);

    return () => {
      socket.off("request:updated", onRequestUpdated);
      socket.off("payment:created", onPaymentCreated);
      socket.off("notice:created", onNoticeCreated);
      socket.off("event:created", onEventCreated);
      socket.off("poll:created", onPollCreated);
      socket.off("complaint:created", onComplaintCreated);
      socket.off("complaint:updated", onComplaintUpdated);
    };
  }, [queryClient, toast]);
};
