import { Router, Request, Response } from "express";
import { Event } from "../models/Event";
import { verifyToken, requireAdmin } from "../middleware/auth";
import { getIO } from "../socket/events";

const router = Router();

// GET /api/events
router.get("/", verifyToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/events — admin only
router.post("/", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, date, time, location } = req.body;
    if (!title || !description || !date) {
      res.status(400).json({ message: "Title, description and date are required" });
      return;
    }
    const event = await Event.create({
      title,
      description,
      date,
      time: time || "",
      location: location || "",
      createdBy: req.user!.name,
    });
    getIO().emit("event:created", { event });
    res.status(201).json(event);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/events/:id — admin only
router.delete("/:id", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
