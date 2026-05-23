import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  createdBy: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, default: "" },
    location: { type: String, default: "" },
    createdBy: { type: String, default: "Management" },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>("Event", EventSchema);
