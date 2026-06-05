import { supabase } from "./supabase";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "resident" | "admin";
  unit: string;
  building: string;
  avatar?: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const apiLogin = async (
  email: string,
  password: string
): Promise<{ token: string; user: UserProfile }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // Fetch profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();
  if (profileError) throw profileError;

  return {
    token: data.session.access_token,
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      unit: profile.unit,
      building: profile.building,
      avatar: profile.avatar || "",
    },
  };
};

export const apiGetMe = async (): Promise<UserProfile> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    unit: profile.unit,
    building: profile.building,
    avatar: profile.avatar || "",
  };
};

// ── Maintenance Requests ─────────────────────────────────────────────────────

export interface MaintenanceRequestData {
  id: string;
  user_id: string;
  user_name: string;
  unit: string;
  title: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  description: string;
  status: "Pending" | "In Progress" | "Completed";
  admin_note?: string;
  image?: string;
  technician_name?: string;
  technician_id?: string;
  technician_phone?: string;
  technician_assigned_at?: string;
  created_at: string;
  updated_at: string;
}

export const getRequests = async (): Promise<MaintenanceRequestData[]> => {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createRequest = async (
  requestData: Omit<
    MaintenanceRequestData,
    "id" | "user_id" | "user_name" | "unit" | "created_at" | "updated_at"
  > & { unit?: string; image?: string }
): Promise<MaintenanceRequestData> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, unit")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert({
      ...requestData,
      user_id: user.id,
      user_name: profile?.name || "Unknown",
      unit: requestData.unit || profile?.unit || "-",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateRequest = async (
  id: string,
  updateData: { status?: string; admin_note?: string }
): Promise<MaintenanceRequestData> => {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const assignTechnician = async (
  id: string,
  techData: {
    technician_name: string;
    technician_id: string;
    technician_phone: string;
  }
): Promise<MaintenanceRequestData> => {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .update({
      ...techData,
      technician_assigned_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("maintenance_requests")
    .delete()
    .eq("id", id);
  if (error) throw error;
};

export const deleteRequestImage = async (
  id: string
): Promise<MaintenanceRequestData> => {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .update({ image: "" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentData {
  id: string;
  user_id: string;
  user_name: string;
  unit: string;
  amount: number;
  due_date: string;
  description: string;
  status: "Pending" | "Paid";
  transaction_id?: string;
  payment_date?: string;
  payment_method?: string;
  created_at: string;
}

export const getPayments = async (): Promise<PaymentData[]> => {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createPayment = async (paymentData: {
  user_id: string;
  amount: number;
  due_date: string;
  description?: string;
}): Promise<PaymentData> => {
  // Look up user info for the target user
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, unit")
    .eq("id", paymentData.user_id)
    .single();

  const { data, error } = await supabase
    .from("payments")
    .insert({
      ...paymentData,
      user_name: profile?.name || "Unknown",
      unit: profile?.unit || "-",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const payPayment = async (
  id: string,
  payData: {
    status: string;
    transaction_id: string;
    payment_date: string;
    payment_method: string;
  }
): Promise<PaymentData> => {
  const { data, error } = await supabase
    .from("payments")
    .update(payData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Notices ───────────────────────────────────────────────────────────────────

export interface NoticeData {
  id: string;
  title: string;
  description: string;
  date: string;
  posted_by?: string;
  created_at: string;
}

export const getNotices = async (): Promise<NoticeData[]> => {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createNotice = async (noticeData: {
  title: string;
  description: string;
}): Promise<NoticeData> => {
  const { data, error } = await supabase
    .from("notices")
    .insert({
      ...noticeData,
      date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteNotice = async (id: string): Promise<void> => {
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw error;
};

export const updateNotice = async (
  id: string,
  updateData: { title?: string; description?: string }
): Promise<NoticeData> => {
  const { data, error } = await supabase
    .from("notices")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const getResidents = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "resident");
  if (error) throw error;
  return data || [];
};

// ── Events ────────────────────────────────────────────────────────────────────

export interface EventItemData {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  created_by?: string;
  created_at: string;
}

export const getEvents = async (): Promise<EventItemData[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createEvent = async (eventData: {
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
}): Promise<EventItemData> => {
  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
};

// ── Polls ─────────────────────────────────────────────────────────────────────

export interface PollOption {
  text: string;
  votes: string[];
}

export interface PollItemData {
  id: string;
  question: string;
  options: PollOption[];
  expiry_date: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
}

export const getPolls = async (): Promise<PollItemData[]> => {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createPoll = async (pollData: {
  question: string;
  options: string[];
  expiry_date: string;
}): Promise<PollItemData> => {
  const { data, error } = await supabase
    .from("polls")
    .insert({
      question: pollData.question,
      options: pollData.options.map((text) => ({ text, votes: [] })),
      expiry_date: pollData.expiry_date,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const voteOnPoll = async (
  pollId: string,
  optionIndex: number
): Promise<PollItemData> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current poll
  const { data: poll, error: fetchError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();
  if (fetchError) throw fetchError;

  // Check if already voted
  const hasVoted = poll.options.some((opt: PollOption) =>
    opt.votes.includes(user.id)
  );
  if (hasVoted) throw new Error("Already voted");

  // Update the vote
  const updatedOptions = [...poll.options];
  updatedOptions[optionIndex].votes.push(user.id);

  const { data, error } = await supabase
    .from("polls")
    .update({ options: updatedOptions })
    .eq("id", pollId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deletePoll = async (id: string): Promise<void> => {
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) throw error;
};

// ── Complaints ────────────────────────────────────────────────────────────────

export interface ComplaintItemData {
  id: string;
  user_id: string;
  user_name: string;
  unit: string;
  subject: string;
  description: string;
  status: "Open" | "In Review" | "Resolved";
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

export const getComplaints = async (): Promise<ComplaintItemData[]> => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createComplaint = async (complaintData: {
  subject: string;
  description: string;
}): Promise<ComplaintItemData> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, unit")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      ...complaintData,
      user_id: user.id,
      user_name: profile?.name || "Unknown",
      unit: profile?.unit || "-",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateComplaint = async (
  id: string,
  updateData: { status?: string; admin_response?: string }
): Promise<ComplaintItemData> => {
  const { data, error } = await supabase
    .from("complaints")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
