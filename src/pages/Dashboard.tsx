import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getPayments, getRequests, getNotices } from "@/lib/api";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Building2, Home, ClipboardList, CreditCard, Users, User, Wrench, DollarSign, Eye, ChevronRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Subscribe to real-time socket events
  useNotifications();

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
    refetchOnWindowFocus: true,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: getRequests,
    refetchOnWindowFocus: true,
  });

  const { data: notices = [] } = useQuery({
    queryKey: ["notices"],
    queryFn: getNotices,
    refetchOnWindowFocus: true,
  });

  const pendingPayments = payments.filter(p => p.status === "Pending");
  const outstandingAmount = pendingPayments.reduce((s, p) => s + p.amount, 0);
  const activeRequests = requests.filter(r => r.status !== "Completed");

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "requests", icon: ClipboardList, label: "Requests" },
    { id: "payments", icon: CreditCard, label: "Payments" },
    { id: "community", icon: Users, label: "Community" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-card-foreground">Skyline Heights</span>
        </div>
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <button onClick={() => { logout(); navigate("/"); }} className="text-xs text-primary font-medium">Logout</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Welcome Card */}
        <div className="bg-card rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Welcome, {user?.name || "Resident"}</h2>
            <p className="text-sm text-muted-foreground">Unit {user?.unit} • {user?.building}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Wrench, label: "Raise Request", action: () => navigate("/maintenance/new") },
              { icon: DollarSign, label: "Pay Fees", action: () => navigate("/payment") },
              { icon: Eye, label: "View Notices", action: () => toast({ title: "Notices", description: "Check community section" }) },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={action} className="bg-card rounded-xl p-4 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-shadow border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-card-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h3>
          <div className="space-y-3">
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Amount</p>
                  <p className="text-2xl font-bold text-card-foreground mt-1">
                    ${outstandingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  {pendingPayments.length > 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Due by {pendingPayments[0]?.due_date}
                    </p>
                  )}
                </div>
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Active Requests</p>
                  <p className="text-2xl font-bold text-card-foreground mt-1">
                    {String(activeRequests.length).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeRequests.map(r => `${r.category} (${r.status})`).join(" & ")}
                  </p>
                </div>
                <ClipboardList className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Notice */}
        {notices[0] && (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Latest Community Notice</span>
            </div>
            <h4 className="font-semibold text-card-foreground">{notices[0].title}</h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notices[0].description}</p>
            <button onClick={() => navigate("/community")} className="text-sm text-primary font-medium mt-2 flex items-center gap-1">
              Read More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                if (id === "requests") navigate("/maintenance");
                else if (id === "payments") navigate("/payment");
                else if (id === "community") navigate("/community");
                else if (id === "profile") navigate("/profile");
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${id === "home" ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
