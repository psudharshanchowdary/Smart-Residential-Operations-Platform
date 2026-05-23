export type UserRole = "resident" | "admin";

export interface User {
  id: string;      // maps to MongoDB _id
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  unit: string;
  building: string;
  avatar?: string;
}

export interface MaintenanceRequest {
  id: string;      // maps to _id from the API response
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
  createdAt: string;
  updatedAt?: string;
  image?: string;
}

export interface Payment {
  id: string;      // maps to _id from the API response
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
  createdAt?: string;
}

export interface Notice {
  id: string;      // maps to _id from the API response
  _id: string;
  title: string;
  description: string;
  date: string;
  postedBy?: string;
  createdAt?: string;
}
