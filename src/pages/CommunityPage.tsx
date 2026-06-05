import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotices, createNotice, updateNotice, deleteNotice,
  getEvents, createEvent, deleteEvent,
  getPolls, createPoll, voteOnPoll, deletePoll,
  getComplaints, createComplaint, updateComplaint,
  NoticeData, EventItemData, PollItemData, ComplaintItemData,
} from "@/lib/api";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Bell, Calendar, Megaphone, BarChart2, MessageSquare,
  Plus, Trash2, Pencil, Check, ChevronLeft, ChevronRight, MapPin, Clock, X
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const statusColors: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-700",
  "In Review": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const CommunityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<"calendar" | "notices" | "polls" | "complaints">("calendar");

  useNotifications();

  const tabs = [
    { id: "calendar" as const,   label: "Events",     icon: Calendar },
    { id: "notices" as const,    label: "Notices",    icon: Megaphone },
    { id: "polls" as const,      label: "Polls",      icon: BarChart2 },
    { id: "complaints" as const, label: "Complaints", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-foreground text-base">Community</h1>
            <p className="text-xs text-muted-foreground">Events, notices, polls & support</p>
          </div>
        </div>
        <Bell className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Tab Bar */}
      <div className="bg-card border-b border-border px-2 flex gap-1 overflow-x-auto sticky top-[57px] z-10">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {activeTab === "calendar"   && <CalendarSection isAdmin={isAdmin} userId={user?.id || ""} />}
        {activeTab === "notices"    && <NoticesSection isAdmin={isAdmin} />}
        {activeTab === "polls"      && <PollsSection isAdmin={isAdmin} userId={user?.id || ""} />}
        {activeTab === "complaints" && <ComplaintsSection isAdmin={isAdmin} user={user} />}
      </div>
    </div>
  );
};

// ─── Calendar / Events Section ─────────────────────────────────────────────────
const CalendarSection = ({ isAdmin, userId }: { isAdmin: boolean; userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected]   = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm] = useState({ title: "", description: "", time: "", location: "" });

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: getEvents });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setShowForm(false); setForm({ title: "", description: "", time: "", location: "" }); toast({ title: "✅ Event created" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast({ title: "Event deleted" }); },
  });

  const eventDates = useMemo(() => new Set(events.map(e => e.date)), [events]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

  const toDateStr = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const selectedEvents = selected ? events.filter(e => e.date === selected) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Community Events</h2>
        {isAdmin && <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Event</button>}
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-semibold text-foreground">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 p-2 gap-1">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const ds = toDateStr(day);
            const hasEvent = eventDates.has(ds);
            const isToday  = ds === today.toISOString().split("T")[0];
            const isSel    = ds === selected;
            return (
              <button key={day} onClick={() => setSelected(isSel ? null : ds)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors
                  ${isSel ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}>
                {day}
                {hasEvent && <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : "bg-primary"}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selected && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{selected}</p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-card rounded-xl border border-border">No events on this day</p>
          ) : selectedEvents.map(e => (
            <div key={e.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{e.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{e.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    {e.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.time}</span>}
                    {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                  </div>
                </div>
                {isAdmin && <button onClick={() => deleteMutation.mutate(e.id)} className="text-destructive hover:opacity-70 p-1"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Events List */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Upcoming Events</p>
        <div className="space-y-2">
          {events.filter(e => e.date >= today.toISOString().split("T")[0]).slice(0, 5).map(e => (
            <div key={e.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                  <span className="text-xs font-bold leading-none">{e.date.split("-")[2]}</span>
                  <span className="text-[9px] uppercase">{MONTHS[parseInt(e.date.split("-")[1]) - 1].slice(0, 3)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{e.title}</p>
                  {e.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{e.location}</p>}
                </div>
              </div>
              {isAdmin && <button onClick={() => deleteMutation.mutate(e.id)} className="text-destructive hover:opacity-70 p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          ))}
          {events.filter(e => e.date >= today.toISOString().split("T")[0]).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 bg-card rounded-xl border border-border">No upcoming events</p>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Create Event</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            {[
              { key: "title", label: "Title *", placeholder: "Community BBQ" },
              { key: "time", label: "Time", placeholder: "6:00 PM" },
              { key: "location", label: "Location", placeholder: "Rooftop Terrace" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date *</label>
              <input type="date" value={selected || ""} onChange={e => setSelected(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <button onClick={() => { if (!form.title || !form.description || !selected) { toast({ title: "Fill all required fields", variant: "destructive" }); return; } createMutation.mutate({ ...form, date: selected! }); }}
              disabled={createMutation.isPending}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Create Event"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Notices Section ───────────────────────────────────────────────────────────
const NoticesSection = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NoticeData | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });

  const { data: notices = [], isLoading } = useQuery({ queryKey: ["notices"], queryFn: getNotices });

  const createMutation = useMutation({
    mutationFn: createNotice,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); setShowForm(false); setForm({ title: "", description: "" }); toast({ title: "✅ Notice posted" }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string } }) => updateNotice(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); setEditing(null); toast({ title: "Notice updated" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); toast({ title: "Notice deleted" }); },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Community Notices</h2>
        {isAdmin && <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg"><Plus className="w-3.5 h-3.5" /> Post Notice</button>}
      </div>

      {isLoading && <p className="text-center text-muted-foreground py-8 text-sm">Loading notices...</p>}

      <div className="space-y-3">
        {notices.map((n, idx) => (
          <div key={n.id} className={`bg-card rounded-2xl border p-4 ${idx === 0 ? "border-primary/30 bg-primary/5" : "border-border"}`}>
            {idx === 0 && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Latest</span>}
            {editing?.id === n.id ? (
              <div className="space-y-2 mt-2">
                <input value={editing.title} onChange={e => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <textarea value={editing.description} onChange={e => setEditing(ed => ed ? { ...ed, description: e.target.value } : ed)} rows={3}
                  className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex gap-2">
                  <button onClick={() => updateMutation.mutate({ id: n.id, data: { title: editing.title, description: editing.description } })}
                    className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">Save</button>
                  <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div className={idx === 0 ? "mt-2" : ""}>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{n.title}</h3>
                  {isAdmin && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => setEditing(n)} className="text-muted-foreground hover:text-primary p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMutation.mutate(n.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
                <p className="text-xs text-muted-foreground mt-2">📅 {n.date} {n.posted_by && `• by ${n.posted_by}`}</p>
              </div>
            )}
          </div>
        ))}
        {!isLoading && notices.length === 0 && <p className="text-center text-muted-foreground py-8 bg-card rounded-2xl border border-border text-sm">No notices yet</p>}
      </div>

      {/* Create Notice Modal */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Post Notice</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Water Supply Interruption"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Enter notice details..."
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <button onClick={() => { if (!form.title || !form.description) { toast({ title: "Fill all fields", variant: "destructive" }); return; } createMutation.mutate(form); }}
              disabled={createMutation.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
              {createMutation.isPending ? "Posting..." : "Post Notice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Polls Section ─────────────────────────────────────────────────────────────
const PollsSection = ({ isAdmin, userId }: { isAdmin: boolean; userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiryDate, setExpiryDate] = useState("");

  const { data: polls = [], isLoading } = useQuery({ queryKey: ["polls"], queryFn: getPolls });

  const createMutation = useMutation({
    mutationFn: createPoll,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["polls"] }); setShowForm(false); setQuestion(""); setOptions(["", ""]); toast({ title: "✅ Poll created" }); },
  });
  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => voteOnPoll(pollId, optionIndex),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["polls"] }); toast({ title: "✅ Vote recorded!" }); },
    onError: (err: any) => toast({ title: err?.response?.data?.message || "Vote failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: deletePoll,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["polls"] }); toast({ title: "Poll deleted" }); },
  });

  const hasVoted = (poll: PollItemData) => poll.options.some(o => o.votes.includes(userId));
  const totalVotes = (poll: PollItemData) => poll.options.reduce((s, o) => s + o.votes.length, 0);
  const isPollExpired = (poll: PollItemData) => new Date(poll.expiry_date) < new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><BarChart2 className="w-5 h-5 text-primary" /> Community Polls</h2>
        {isAdmin && <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg"><Plus className="w-3.5 h-3.5" /> Create Poll</button>}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading polls...</p>}

      <div className="space-y-4">
        {polls.map(poll => {
          const voted = hasVoted(poll);
          const total = totalVotes(poll);
          const expired = isPollExpired(poll);
          const showResults = voted || expired || isAdmin;
          return (
            <div key={poll.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{poll.question}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {expired ? "⏰ Expired" : `Expires ${poll.expiry_date}`} • {total} vote{total !== 1 ? "s" : ""}
                  </p>
                </div>
                {isAdmin && <button onClick={() => deleteMutation.mutate(poll.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button>}
              </div>
              <div className="space-y-2">
                {poll.options.map((opt, idx) => {
                  const pct = total > 0 ? Math.round((opt.votes.length / total) * 100) : 0;
                  const myVote = opt.votes.includes(userId);
                  return (
                    <div key={idx}>
                      {showResults ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-medium ${myVote ? "text-primary" : "text-foreground"}`}>
                              {myVote && <Check className="w-3 h-3 inline mr-1 text-primary" />}{opt.text}
                            </span>
                            <span className="text-muted-foreground text-xs">{pct}% ({opt.votes.length})</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${myVote ? "bg-primary" : "bg-muted-foreground/40"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => voteMutation.mutate({ pollId: poll.id, optionIndex: idx })}
                          disabled={voteMutation.isPending}
                          className="w-full text-left px-4 py-2.5 rounded-xl border border-input hover:border-primary hover:bg-primary/5 text-sm font-medium transition-colors disabled:opacity-50">
                          {opt.text}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {voted && !expired && <p className="text-xs text-primary mt-2 font-medium">✅ You voted</p>}
              {expired && <p className="text-xs text-muted-foreground mt-2">This poll has closed</p>}
            </div>
          );
        })}
        {!isLoading && polls.length === 0 && <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl border border-border">No polls yet</p>}
      </div>

      {/* Create Poll Modal */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Create Poll</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Question</label>
              <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} placeholder="What amenity should we add?"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Options</label>
              <div className="space-y-2 mt-1">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={opt} onChange={e => setOptions(os => os.map((o, j) => j === i ? e.target.value : o))} placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    {options.length > 2 && <button onClick={() => setOptions(os => os.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70"><X className="w-4 h-4" /></button>}
                  </div>
                ))}
                <button onClick={() => setOptions(os => [...os, ""])} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add option</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Expiry Date</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={() => { if (!question || options.filter(Boolean).length < 2 || !expiryDate) { toast({ title: "Fill all fields with at least 2 options", variant: "destructive" }); return; } createMutation.mutate({ question, options: options.filter(Boolean), expiry_date: expiryDate }); }}
              disabled={createMutation.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Complaints Section ────────────────────────────────────────────────────────
const ComplaintsSection = ({ isAdmin, user }: { isAdmin: boolean; user: any }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "" });
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: complaints = [], isLoading } = useQuery({ queryKey: ["complaints"], queryFn: getComplaints });

  const createMutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); setShowForm(false); setForm({ subject: "", description: "" }); toast({ title: "✅ Complaint submitted" }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; admin_response?: string } }) => updateComplaint(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); setResponding(null); toast({ title: "Updated" }); },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> {isAdmin ? "All Complaints" : "My Complaints"}</h2>
        {!isAdmin && <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg"><Plus className="w-3.5 h-3.5" /> Submit</button>}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}

      <div className="space-y-3">
        {complaints.map(c => (
          <div key={c.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{c.subject}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                </div>
                {isAdmin && <p className="text-xs text-muted-foreground mt-0.5">{c.user_name} • {c.unit}</p>}
                <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                {c.admin_response && (
                  <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-primary mb-1">📋 Admin Response</p>
                    <p className="text-sm text-foreground">{c.admin_response}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">📅 {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              {isAdmin && (
                <div className="flex flex-col gap-1">
                  {["Open", "In Review", "Resolved"].map(s => (
                    <button key={s} onClick={() => updateMutation.mutate({ id: c.id, data: { status: s } })}
                      className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${c.status === s ? statusColors[s] : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isAdmin && (
              responding === c.id ? (
                <div className="mt-3 space-y-2">
                  <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={2} placeholder="Type your response..."
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                  <div className="flex gap-2">
                    <button onClick={() => { updateMutation.mutate({ id: c.id, data: { admin_response: responseText } }); setResponseText(""); }}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">Send Response</button>
                    <button onClick={() => setResponding(null)} className="text-xs text-muted-foreground px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setResponding(c.id); setResponseText(c.admin_response || ""); }}
                  className="mt-2 text-xs text-primary hover:underline">
                  {c.admin_response ? "Edit response" : "+ Add response"}
                </button>
              )
            )}
          </div>
        ))}
        {!isLoading && complaints.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-2xl border border-border">
            {isAdmin ? "No complaints submitted yet" : "You haven't submitted any complaints"}
          </p>
        )}
      </div>

      {/* Submit Complaint Modal */}
      {showForm && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Submit Complaint</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Noisy neighbors, parking issue..."
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the issue in detail..."
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <button onClick={() => { if (!form.subject || !form.description) { toast({ title: "Fill all fields", variant: "destructive" }); return; } createMutation.mutate(form); }}
              disabled={createMutation.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
              {createMutation.isPending ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
