import mongoose, { Document, Schema } from "mongoose";

export interface IMaintenanceRequest extends Document {
  userId: mongoose.Types.ObjectId;
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
  technicianAssignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    unit: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    description: { type: String, required: true },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    adminNote: { type: String, default: "" },
    image: { type: String, default: "" },
    technicianName: { type: String, default: "" },
    technicianId: { type: String, default: "" },
    technicianPhone: { type: String, default: "" },
    technicianAssignedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MaintenanceRequest = mongoose.model<IMaintenanceRequest>(
  "MaintenanceRequest",
  MaintenanceRequestSchema
);
