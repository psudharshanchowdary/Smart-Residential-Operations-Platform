import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getRequests } from "@/lib/api";
import { useNotifications } from "@/hooks/useNotifications";
import { Building2, Bell, Plus, Search, Filter, Home, ClipboardList, CreditCard, User, ChevronRight } from "lucide-react";

const statusColor: Record<string, string> = {
  "In Progress": "bg-primary/10 text-primary",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-success/10 text-success",
};

const MaintenanceStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("All Requests");
  const [search, setSearch] = useState("");

  // Subscribe to real-time socket events (requests:updated will invalidate the query)
  useNotifications();

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: getRequests,
    refetchOnWindowFocus: true,
  });

  const filtered = useMemo(() => {
    let list = allRequests;
    if (tab === "In Progress") list = list.filter(r => r.status === "In Progress");
    if (tab === "Completed") list = list.filter(r => r.status === "Completed");
    if (search)
      list = list.filter(
        r =>
          r._id.toLowerCase().includes(search.toLowerCase()) ||
          r.title.toLowerCase().includes(search.toLowerCase())
      );
    return list;
  }, [tab, search, allRequests]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-card-foreground">Maintenance</span>
          </div>
          <p className="text-xs text-muted-foreground ml-7">Unit {user?.unit} - North Tower</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <button onClick={() => navigate("/maintenance/new")} className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New Request
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {["All Requests", "In Progress", "Completed"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button className="p-2.5 border border-input rounded-lg text-muted-foreground hover:bg-muted">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Request Cards */}
        <div className="space-y-3">
          {isLoading && <p className="text-center text-muted-foreground text-sm py-8">Loading requests...</p>}
          {filtered.map(r => (
            <div key={r._id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              {r.priority === "High" && (
                <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 w-fit m-3 mb-0 rounded">URGENT</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">#{r._id.slice(-6).toUpperCase()}</p>
                    <h3 className="font-semibold text-card-foreground mt-0.5">{r.title}</h3>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[r.status] || ""}`}>
                    {r.status === "Pending" ? "Pending Review" : r.status}
                  </span>
                </div>
                {r.adminNote && (
                  <p className="text-xs text-primary mt-1 font-medium">📝 {r.adminNote}</p>
                )}
                {r.image && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border">
                    <img src={r.image} alt="Attached photo" className="w-full max-h-40 object-cover" />
                  </div>
                )}

                {/* Technician Details — shown only when assigned */}
                {r.technicianName && (
                  <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary">🔧 Technician Assigned</span>
                      {r.technicianAssignedAt && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(r.technicianAssignedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground">{r.technicianName}</p>
                    <p className="text-[11px] text-muted-foreground">Employee ID: {r.technicianId}</p>
                    <a
                      href={`tel:${r.technicianPhone}`}
                      className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      📞 Call: {r.technicianPhone}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>📅 {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
                  <span>🔧 {r.category}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <button className="text-xs text-primary font-medium flex items-center gap-0.5">
                    {r.status === "Completed" ? "View History" : "View Status"} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No requests found</p>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[
            { icon: Home, label: "Home", path: "/dashboard" },
            { icon: ClipboardList, label: "Requests", path: "/maintenance" },
            { icon: CreditCard, label: "Payments", path: "/payment" },
            { icon: User, label: "Profile", path: "/dashboard" },
          ].map(({ icon: Icon, label, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${label === "Requests" ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceStatus;
