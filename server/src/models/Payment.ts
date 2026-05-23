import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  unit: string;
  amount: number;
  dueDate: string;
  description: string;
  status: "Pending" | "Paid";
  transactionId?: string;
  paymentDate?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    unit: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: String, required: true },
    description: { type: String, default: "Maintenance Fee" },
    status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    transactionId: { type: String },
    paymentDate: { type: String },
    paymentMethod: { type: String },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
