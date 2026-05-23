import { Router, Request, Response } from "express";
import { Notice } from "../models/Notice";
import { verifyToken, requireAdmin } from "../middleware/auth";
import { getIO } from "../socket/events";

const router = Router();

// GET /api/notices
router.get("/", verifyToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/notices — admin only
router.post("/", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ message: "Title and description are required" });
      return;
    }
    const notice = await Notice.create({
      title,
      description,
      date: new Date().toISOString().split("T")[0],
      postedBy: req.user!.name,
    });
    getIO().emit("notice:created", { notice });
    res.status(201).json(notice);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/notices/:id — admin edits
router.patch("/:id", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const updated = await Notice.findByIdAndUpdate(
      req.params.id,
      { ...(title && { title }), ...(description && { description }) },
      { new: true }
    );
    if (!updated) { res.status(404).json({ message: "Not found" }); return; }
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/notices/:id — admin only
router.delete("/:id", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
