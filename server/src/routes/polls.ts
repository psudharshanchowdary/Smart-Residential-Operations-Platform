import { Router, Request, Response } from "express";
import { Poll } from "../models/Poll";
import { verifyToken, requireAdmin } from "../middleware/auth";
import { getIO } from "../socket/events";

const router = Router();

// GET /api/polls
router.get("/", verifyToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/polls — admin creates poll
router.post("/", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, options, expiryDate } = req.body;
    if (!question || !options || options.length < 2 || !expiryDate) {
      res.status(400).json({ message: "Question, at least 2 options, and expiry date required" });
      return;
    }
    const poll = await Poll.create({
      question,
      options: options.map((text: string) => ({ text, votes: [] })),
      expiryDate,
      createdBy: req.user!.name,
      isActive: true,
    });
    getIO().emit("poll:created", { poll });
    res.status(201).json(poll);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/polls/:id/vote — resident votes
router.post("/:id/vote", verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { optionIndex } = req.body;
    const userId = req.user!.id;

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      res.status(404).json({ message: "Poll not found" });
      return;
    }

    // Check if expired
    if (new Date(poll.expiryDate) < new Date()) {
      res.status(400).json({ message: "This poll has expired" });
      return;
    }

    // Check if already voted in any option
    const alreadyVoted = poll.options.some((opt) => opt.votes.includes(userId));
    if (alreadyVoted) {
      res.status(400).json({ message: "You have already voted in this poll" });
      return;
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      res.status(400).json({ message: "Invalid option" });
      return;
    }

    poll.options[optionIndex].votes.push(userId);
    await poll.save();

    res.json(poll);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/polls/:id — admin only
router.delete("/:id", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await Poll.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
