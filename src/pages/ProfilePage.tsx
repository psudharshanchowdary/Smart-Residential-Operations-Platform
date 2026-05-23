import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getRequests, getPayments, getComplaints } from "@/lib/api";
import {
  ArrowLeft, Building2, Mail, Home, Shield, CreditCard,
  ClipboardList, MessageSquare, LogOut, ChevronRight, Star
} from "lucide-react";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: getRequests });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: getPayments });
  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints"],
    queryFn: getComplaints,
    enabled: !isAdmin,
  });

  const completedRequests  = requests.filter(r => r.status === "Completed").length;
  const pendingRequests    = requests.filter(r => r.status !== "Completed").length;
  const paidPayments       = payments.filter(p => p.status === "Paid");
  const pendingPaymentsArr = payments.filter(p => p.status === "Pending");
  const totalPaid          = paidPayments.reduce((s, p) => s + p.amount, 0);
  const totalDue           = pendingPaymentsArr.reduce((s, p) => s + p.amount, 0);
  const resolvedComplaints = complaints.filter(c => c.status === "Resolved").length;

  const initials = user?.name
    ?.split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const residentStats = [
    { label: "Requests Submitted",  value: requests.length,                  icon: ClipboardList, color: "text-primary",     bg: "bg-primary/10" },
    { label: "Completed Requests",  value: completedRequests,                icon: Shield,        color: "text-green-600",  bg: "bg-green-100" },
    { label: "Pending Requests",    value: pendingRequests,                  icon: ClipboardList, color: "text-yellow-600", bg: "bg-yellow-100" },
    { label: "Total Paid",          value: `$${totalPaid.toLocaleString()}`, icon: CreditCard,    color: "text-green-600",  bg: "bg-green-100" },
    { label: "Amount Due",          value: `$${totalDue.toLocaleString()}`,  icon: CreditCard,    color: "text-destructive",bg: "bg-destructive/10" },
    { label: "Complaints Resolved", value: resolvedComplaints,               icon: MessageSquare, color: "text-primary",    bg: "bg-primary/10" },
  ];

  const adminStats = [
    { label: "Total Requests",    value: requests.length,                  icon: ClipboardList, color: "text-primary",     bg: "bg-primary/10" },
    { label: "Completed",         value: completedRequests,                icon: Shield,        color: "text-green-600",  bg: "bg-green-100" },
    { label: "Total Payments",    value: payments.length,                  icon: CreditCard,    color: "text-primary",     bg: "bg-primary/10" },
    { label: "Paid Payments",     value: paidPayments.length,              icon: CreditCard,    color: "text-green-600",  bg: "bg-green-100" },
    { label: "Revenue Collected", value: `$${totalPaid.toLocaleString()}`, icon: Star,          color: "text-yellow-600", bg: "bg-yellow-100" },
    { label: "Pending Revenue",   value: `$${totalDue.toLocaleString()}`,  icon: Star,          color: "text-destructive",bg: "bg-destructive/10" },
  ];

  const stats = isAdmin ? adminStats : residentStats;

  const residentLinks = [
    { label: "My Maintenance Requests", icon: ClipboardList, path: "/maintenance" },
    { label: "My Payments",             icon: CreditCard,    path: "/payment" },
    { label: "Community & Notices",     icon: Building2,     path: "/community" },
    { label: "Submit Complaint",        icon: MessageSquare, path: "/community" },
  ];

  const adminLinks = [
    { label: "Manage Requests",      icon: ClipboardList, path: "/admin" },
    { label: "View Payments",        icon: CreditCard,    path: "/admin" },
    { label: "Community Management", icon: Building2,     path: "/community" },
  ];

  const links = isAdmin ? adminLinks : residentLinks;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-foreground">My Profile</span>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="text-xs text-destructive font-medium flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Avatar + Info Card */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg mb-4">
            {initials}
          </div>
          <h1 className="text-xl font-bold text-foreground">{user?.name}</h1>
          <span className={`mt-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isAdmin ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {isAdmin ? "🛡️ Admin" : "🏠 Resident"}
          </span>

          {/* Detail rows */}
          <div className="w-full mt-5 space-y-3 text-left">
            {[
              { icon: Mail,      label: "Email",    value: user?.email    || "—" },
              { icon: Home,      label: "Unit",     value: user?.unit     || "—" },
              { icon: Building2, label: "Building", value: user?.building || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h2>
          <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            {links.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Account Type</span>
              <span className="text-foreground font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span>Member Since</span>
              <span className="text-foreground font-medium">2024</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-green-600 font-medium">✅ Active</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
