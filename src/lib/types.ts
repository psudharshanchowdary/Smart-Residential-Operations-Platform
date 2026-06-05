export type UserRole = "resident" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit: string;
  building: string;
  avatar?: string;
}

export interface MaintenanceRequest {
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
  created_at: string;
  updated_at?: string;
  image?: string;
  technician_name?: string;
  technician_id?: string;
  technician_phone?: string;
  technician_assigned_at?: string;
}

export interface Payment {
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
  created_at?: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string;
  posted_by?: string;
  created_at?: string;
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  created_by?: string;
  created_at?: string;
}

export interface PollOption {
  text: string;
  votes: string[];
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  expiry_date: string;
  created_by?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ComplaintData {
  id: string;
  user_id: string;
  user_name: string;
  unit: string;
  subject: string;
  description: string;
  status: "Open" | "In Review" | "Resolved";
  admin_response?: string;
  created_at?: string;
  updated_at?: string;
}
