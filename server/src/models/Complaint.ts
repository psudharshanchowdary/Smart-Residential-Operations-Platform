import mongoose, { Document, Schema } from "mongoose";

export interface IComplaint extends Document {
  userId: string;
  userName: string;
  unit: string;
  subject: string;
  description: string;
  status: "Open" | "In Review" | "Resolved";
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    unit: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "In Review", "Resolved"],
      default: "Open",
    },
    adminResponse: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>("Complaint", ComplaintSchema);
