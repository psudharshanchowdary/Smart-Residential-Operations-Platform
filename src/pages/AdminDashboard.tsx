import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequests, getPayments, getResidents, updateRequest, createPayment, deleteRequestImage, assignTechnician, MaintenanceRequestData, PaymentData } from "@/lib/api";
import { Users, ClipboardList, CreditCard, CheckCircle, LogOut, Bell, Building2, Trash2, ImageOff, UserCog, Phone, BadgeCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"dashboard" | "requests" | "payments" | "send">("dashboard");

  const { data: residents = [] } = useQuery({ queryKey: ["residents"], queryFn: getResidents });
  const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: getRequests });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: getPayments });

  const stats = [
    { label: "Total Residents", value: residents.length, icon: Users, color: "text-primary" },
    { label: "Active Requests", value: requests.filter(r => r.status !== "Completed").length, icon: ClipboardList, color: "text-warning" },
    { label: "Pending Payments", value: payments.filter(p => p.status === "Pending").length, icon: CreditCard, color: "text-destructive" },
    { label: "Completed Requests", value: requests.filter(r => r.status === "Completed").length, icon: CheckCircle, color: "text-success" },
  ];

  const nav = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "requests" as const, label: "Manage Requests" },
    { id: "payments" as const, label: "View Payments" },
    { id: "send" as const, label: "Send Payment Request" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-card-foreground">Admin Panel</span>
          </div>
          <p className="text-xs text-muted-foreground ml-7">Skyline Towers Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/community")} className="text-xs text-primary font-medium flex items-center gap-1 border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary/5">
            🏘️ Community
          </button>
          <Bell className="w-5 h-5 text-muted-foreground" />
          <button onClick={() => { logout(); navigate("/"); }} className="text-xs text-destructive font-medium flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Nav Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border mb-6">
          {nav.map(n => (
            <button key={n.id} onClick={() => setActiveSection(n.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSection === n.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              {n.label}
            </button>
          ))}
        </div>

        {activeSection === "dashboard" && <DashboardView stats={stats} />}
        {activeSection === "requests" && <ManageRequests requests={requests} toast={toast} />}
        {activeSection === "payments" && <ViewPayments payments={payments} />}
        {activeSection === "send" && <SendPaymentRequest residents={residents} toast={toast} />}
      </div>
    </div>
  );
};

const DashboardView = ({ stats }: { stats: { label: string; value: number; icon: any; color: string }[] }) => (
  <div className="grid grid-cols-2 gap-3">
    {stats.map(s => (
      <div key={s.label} className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <s.icon className={`w-5 h-5 ${s.color}`} />
        </div>
        <p className="text-2xl font-bold text-foreground mt-2">{s.value}</p>
        <p className="text-xs text-muted-foreground">{s.label}</p>
      </div>
    ))}
  </div>
);

const ManageRequests = ({ requests, toast }: { requests: MaintenanceRequestData[]; toast: any }) => {
  const queryClient = useQueryClient();
  const [editingNote, setEditingNote] = useState<{ id: string; note: string } | null>(null);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState<string | null>(null);
  const [techModal, setTechModal] = useState<{
    requestId: string;
    name: string;
    empId: string;
    phone: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, status, admin_note }: { id: string; status?: string; admin_note?: string }) =>
      updateRequest(id, { status, admin_note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "Status updated", description: "Resident will be notified in real-time." });
      setEditingNote(null);
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: string) => deleteRequestImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "Image deleted", description: "The attached image has been removed successfully." });
      setConfirmDeleteImage(null);
    },
    onError: () => {
      toast({ title: "Delete failed", description: "Could not delete the image. Please try again.", variant: "destructive" });
      setConfirmDeleteImage(null);
    },
  });

  const assignTechMutation = useMutation({
    mutationFn: ({ id, name, empId, phone }: { id: string; name: string; empId: string; phone: string }) =>
      assignTechnician(id, { technician_name: name, technician_id: empId, technician_phone: phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "✅ Technician assigned!", description: "Resident will be notified in real-time." });
      setTechModal(null);
    },
    onError: () => toast({ title: "Assignment failed", variant: "destructive" }),
  });

  const openTechModal = (r: MaintenanceRequestData) => {
    setTechModal({
      requestId: r.id,
      name: r.technician_name || "",
      empId: r.technician_id || "",
      phone: r.technician_phone || "",
    });
  };

  const statusBg: Record<string, string> = {
    Pending: "bg-warning/10 text-warning",
    "In Progress": "bg-primary/10 text-primary",
    Completed: "bg-success/10 text-success",
  };

  return (
    <div className="space-y-3">
      {/* Confirmation Dialog */}
      {confirmDeleteImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <ImageOff className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-bold text-foreground text-lg">Delete Image?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this image? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setConfirmDeleteImage(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteImageMutation.mutate(confirmDeleteImage)}
                  disabled={deleteImageMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {deleteImageMutation.isPending ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Technician Modal ─────────────────────────────────────── */}
      {techModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">Assign Technician</h3>
              </div>
              <button onClick={() => setTechModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Technician Name *</label>
                <input
                  value={techModal.name}
                  onChange={e => setTechModal(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g. Ravi Kumar"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Employee ID *</label>
                <input
                  value={techModal.empId}
                  onChange={e => setTechModal(prev => prev ? { ...prev, empId: e.target.value } : null)}
                  placeholder="e.g. EMP102"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone Number *</label>
                <input
                  value={techModal.phone}
                  onChange={e => setTechModal(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  placeholder="e.g. 9876543210"
                  type="tel"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setTechModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!techModal.name.trim() || !techModal.empId.trim() || !techModal.phone.trim()) {
                    toast({ title: "All fields are required", variant: "destructive" });
                    return;
                  }
                  assignTechMutation.mutate({ id: techModal.requestId, name: techModal.name, empId: techModal.empId, phone: techModal.phone });
                }}
                disabled={assignTechMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {assignTechMutation.isPending ? "Saving..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {requests.length === 0 && <p className="text-center text-muted-foreground py-8">No maintenance requests</p>}
      {requests.map(r => (

        <div key={r.id} className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">#{r.id.slice(-6).toUpperCase()} • {r.user_name}</p>
              <h3 className="font-semibold text-foreground">{r.title}</h3>
              <p className="text-xs text-muted-foreground">{r.unit} • {r.category} • {r.priority} priority</p>
              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{r.description}</p>

              {/* Image with Delete Button — Admin Only */}
              {r.image && (
                <div className="mt-3 relative inline-block group">
                  <div className="rounded-lg overflow-hidden border border-border w-32">
                    <img src={r.image} alt="Attached photo" className="w-full h-20 object-cover" />
                  </div>
                  <button
                    onClick={() => setConfirmDeleteImage(r.id)}
                    title="Delete image"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-1 text-center">Hover to remove</p>
                </div>
              )}

              {!r.image && (
                <p className="text-[10px] text-muted-foreground/50 mt-2 italic">No image attached</p>
              )}
            </div>
            <select
              value={r.status}
              onChange={e => mutation.mutate({ id: r.id, status: e.target.value })}
              className={`text-xs font-medium px-2 py-1 rounded-lg border-0 ${statusBg[r.status]} cursor-pointer`}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Admin note editing */}
          {editingNote?.id === r.id ? (
            <div className="mt-2 flex gap-2">
              <input
                value={editingNote.note}
                onChange={e => setEditingNote({ id: r.id, note: e.target.value })}
                placeholder="Add a note for the resident..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => mutation.mutate({ id: r.id, admin_note: editingNote.note })}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg"
              >
                Save
              </button>
              <button onClick={() => setEditingNote(null)} className="text-xs text-muted-foreground px-2 py-1.5">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setEditingNote({ id: r.id, note: r.admin_note || "" })}
              className="mt-2 text-xs text-primary hover:underline"
            >
              {r.admin_note ? `📝 "${r.admin_note}"` : "+ Add note for resident"}
            </button>
          )}
          {/* Technician already assigned — summary */}
          {r.technician_name && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Technician Assigned</span>
                {r.technician_assigned_at && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(r.technician_assigned_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground font-medium">{r.technician_name}</p>
              <p className="text-[11px] text-muted-foreground">ID: {r.technician_id}</p>
              <a href={`tel:${r.technician_phone}`} className="text-[11px] text-primary flex items-center gap-1 mt-0.5 hover:underline w-fit">
                <Phone className="w-3 h-3" /> {r.technician_phone}
              </a>
            </div>
          )}

          {/* Assign Technician button */}
          <button
            onClick={() => openTechModal(r)}
            className="mt-2 text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <UserCog className="w-3.5 h-3.5" />
            {r.technician_name ? "Reassign Technician" : "Assign Technician"}
          </button>
        </div>
      ))}
    </div>
  );
};

const ViewPayments = ({ payments }: { payments: PaymentData[] }) => (
  <div className="space-y-3">
    {payments.map(p => (
      <div key={p.id} className="bg-card rounded-xl p-4 shadow-sm border border-border flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground">{p.transaction_id || p.id.slice(-8).toUpperCase()} • {p.user_name}</p>
          <p className="font-semibold text-foreground">${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground">{p.unit} • Due {p.due_date}</p>
          {p.payment_date && <p className="text-xs text-success">Paid: {p.payment_date} via {p.payment_method}</p>}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === "Paid" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {p.status}
        </span>
      </div>
    ))}
    {payments.length === 0 && <p className="text-center text-muted-foreground py-8">No payments found</p>}
  </div>
);

const SendPaymentRequest = ({ residents, toast }: { residents: any[]; toast: any }) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createPayment({ user_id: userId, amount: parseFloat(amount), due_date: dueDate, description: description || "Maintenance Fee" }),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      const resident = residents.find(u => u.id === userId);
      toast({ title: "Payment request sent!", description: `$${amount} sent to ${resident?.name}. They'll be notified instantly.` });
      setAmount(""); setDueDate(""); setDescription(""); setUserId("");
    },
    onError: () => toast({ title: "Failed to send payment request", variant: "destructive" }),
  });

  const handleSend = () => {
    if (!userId || !amount || !dueDate) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-4 max-w-md">
      <h3 className="font-bold text-foreground">Create Payment Request</h3>
      <div>
        <label className="text-xs text-muted-foreground font-medium">Select Resident</label>
        <select value={userId} onChange={e => setUserId(e.target.value)}
          className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Select...</option>
          {residents.map(u => <option key={u.id} value={u.id}>{u.name} - Unit {u.unit}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground font-medium">Amount ($)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1250.00"
          className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground font-medium">Due Date</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground font-medium">Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Monthly Maintenance Fee"
          className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <button onClick={handleSend} disabled={mutation.isPending}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50">
        {mutation.isPending ? "Sending..." : "Send Payment Request"}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        ⚡ The resident will receive a real-time notification instantly
      </p>
    </div>
  );
};

export default AdminDashboard;
