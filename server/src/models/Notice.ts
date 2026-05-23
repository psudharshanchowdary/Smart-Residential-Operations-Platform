import mongoose, { Document, Schema } from "mongoose";

export interface INotice extends Document {
  title: string;
  description: string;
  date: string;
  postedBy?: string;
  createdAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    postedBy: { type: String, default: "Management" },
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>("Notice", NoticeSchema);
