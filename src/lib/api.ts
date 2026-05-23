import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("apt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("apt_token");
      localStorage.removeItem("apt_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
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

export const apiLogin = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>("/auth/login", { email, password });
  return res.data;
};

export const apiGetMe = async (): Promise<UserProfile> => {
  const res = await api.get<UserProfile>("/auth/me");
  return res.data;
};

// ── Requests ─────────────────────────────────────────────────────────────────

export interface MaintenanceRequestData {
  _id: string;
  userId: string;
  userName: string;
  unit: string;
  title: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  description: string;
  status: "Pending" | "In Progress" | "Completed";
  adminNote?: string;
  image?: string;
  technicianName?: string;
  technicianId?: string;
  technicianPhone?: string;
  technicianAssignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const getRequests = async (): Promise<MaintenanceRequestData[]> => {
  const res = await api.get<MaintenanceRequestData[]>("/requests");
  return res.data;
};

export const createRequest = async (
  data: Omit<MaintenanceRequestData, "_id" | "userId" | "userName" | "unit" | "createdAt" | "updatedAt"> & { unit?: string; image?: string }
): Promise<MaintenanceRequestData> => {
  const res = await api.post<MaintenanceRequestData>("/requests", data);
  return res.data;
};

export const updateRequest = async (
  id: string,
  data: { status?: string; adminNote?: string }
): Promise<MaintenanceRequestData> => {
  const res = await api.patch<MaintenanceRequestData>(`/requests/${id}`, data);
  return res.data;
};

export const assignTechnician = async (
  id: string,
  data: { technicianName: string; technicianId: string; technicianPhone: string }
): Promise<MaintenanceRequestData> => {
  const res = await api.patch<MaintenanceRequestData>(`/requests/${id}/assign-tech`, data);
  return res.data;
};

export const deleteRequest = async (id: string): Promise<void> => {
  await api.delete(`/requests/${id}`);
};

export const deleteRequestImage = async (id: string): Promise<MaintenanceRequestData> => {
  const res = await api.delete<MaintenanceRequestData>(`/requests/${id}/image`);
  return res.data;
};


// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentData {
  _id: string;
  userId: string;
  userName: string;
  unit: string;
  amount: number;
  dueDate: string;
  description: string;
  status: "Pending" | "Paid";
  transactionId?: string;
  paymentDate?: string;
  paymentMethod?: string;
  createdAt: string;
}

export const getPayments = async (): Promise<PaymentData[]> => {
  const res = await api.get<PaymentData[]>("/payments");
  return res.data;
};

export const createPayment = async (data: {
  userId: string;
  amount: number;
  dueDate: string;
  description?: string;
}): Promise<PaymentData> => {
  const res = await api.post<PaymentData>("/payments", data);
  return res.data;
};

export const payPayment = async (
  id: string,
  data: { status: string; transactionId: string; paymentDate: string; paymentMethod: string }
): Promise<PaymentData> => {
  const res = await api.patch<PaymentData>(`/payments/${id}`, data);
  return res.data;
};

// ── Notices ───────────────────────────────────────────────────────────────────

export interface NoticeData {
  _id: string;
  title: string;
  description: string;
  date: string;
  postedBy?: string;
  createdAt: string;
}

export const getNotices = async (): Promise<NoticeData[]> => {
  const res = await api.get<NoticeData[]>("/notices");
  return res.data;
};

export const createNotice = async (data: { title: string; description: string }): Promise<NoticeData> => {
  const res = await api.post<NoticeData>("/notices", data);
  return res.data;
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const getResidents = async (): Promise<UserProfile[]> => {
  const res = await api.get<UserProfile[]>("/users/residents");
  return res.data;
};

export const deleteNotice = async (id: string): Promise<void> => { await api.delete(`/notices/${id}`); };
export const updateNotice = async (id: string, data: { title?: string; description?: string }): Promise<NoticeData> => {
  const res = await api.patch<NoticeData>(`/notices/${id}`, data); return res.data;
};

// ── Events ────────────────────────────────────────────────────────────────────
export interface EventData {
  _id: string; title: string; description: string; date: string;
  time?: string; location?: string; createdBy?: string; createdAt: string;
}
export const getEvents = async (): Promise<EventData[]> => { const res = await api.get<EventData[]>("/events"); return res.data; };
export const createEvent = async (data: { title: string; description: string; date: string; time?: string; location?: string }): Promise<EventData> => {
  const res = await api.post<EventData>("/events", data); return res.data;
};
export const deleteEvent = async (id: string): Promise<void> => { await api.delete(`/events/${id}`); };

// ── Polls ─────────────────────────────────────────────────────────────────────
export interface PollOption { text: string; votes: string[] }
export interface PollData {
  _id: string; question: string; options: PollOption[];
  expiryDate: string; createdBy?: string; isActive: boolean; createdAt: string;
}
export const getPolls = async (): Promise<PollData[]> => { const res = await api.get<PollData[]>("/polls"); return res.data; };
export const createPoll = async (data: { question: string; options: string[]; expiryDate: string }): Promise<PollData> => {
  const res = await api.post<PollData>("/polls", data); return res.data;
};
export const voteOnPoll = async (pollId: string, optionIndex: number): Promise<PollData> => {
  const res = await api.post<PollData>(`/polls/${pollId}/vote`, { optionIndex }); return res.data;
};
export const deletePoll = async (id: string): Promise<void> => { await api.delete(`/polls/${id}`); };

// ── Complaints ────────────────────────────────────────────────────────────────
export interface ComplaintData {
  _id: string; userId: string; userName: string; unit: string;
  subject: string; description: string; status: "Open" | "In Review" | "Resolved";
  adminResponse?: string; createdAt: string; updatedAt: string;
}
export const getComplaints = async (): Promise<ComplaintData[]> => { const res = await api.get<ComplaintData[]>("/complaints"); return res.data; };
export const createComplaint = async (data: { subject: string; description: string }): Promise<ComplaintData> => {
  const res = await api.post<ComplaintData>("/complaints", data); return res.data;
};
export const updateComplaint = async (id: string, data: { status?: string; adminResponse?: string }): Promise<ComplaintData> => {
  const res = await api.patch<ComplaintData>(`/complaints/${id}`, data); return res.data;
};
