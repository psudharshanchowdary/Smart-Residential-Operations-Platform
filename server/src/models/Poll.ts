import mongoose, { Document, Schema } from "mongoose";

export interface IPollOption {
  text: string;
  votes: string[]; // array of userIds who voted for this option
}

export interface IPoll extends Document {
  question: string;
  options: IPollOption[];
  expiryDate: string;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
}

const PollSchema = new Schema<IPoll>(
  {
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: [{ type: String }], // userId strings
      },
    ],
    expiryDate: { type: String, required: true },
    createdBy: { type: String, default: "Admin" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Poll = mongoose.model<IPoll>("Poll", PollSchema);
