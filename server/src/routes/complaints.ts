import { Router, Request, Response } from "express";
import { Complaint } from "../models/Complaint";
import { verifyToken, requireAdmin } from "../middleware/auth";
import { getIO } from "../socket/events";

const router = Router();

// POST /api/complaints — resident submits
router.post("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, description } = req.body;
    if (!subject || !description) {
      res.status(400).json({ message: "Subject and description are required" });
      return;
    }
    const complaint = await Complaint.create({
      userId: req.user!.id,
      userName: req.user!.name,
      unit: "Unit " + (req as any).userUnit || "Unknown",
      subject,
      description,
      status: "Open",
    });

    // Notify admins
    getIO().to("admin").emit("complaint:created", { complaint });

    res.status(201).json(complaint);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/complaints — admin sees all; resident sees own
router.get("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.user!.role === "admin" ? {} : { userId: req.user!.id };
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json(complaints);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/complaints/:id — admin updates status/response
router.patch("/:id", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, adminResponse } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(adminResponse !== undefined && { adminResponse }),
      },
      { new: true }
    );
    if (!complaint) {
      res.status(404).json({ message: "Complaint not found" });
      return;
    }
    // Notify the resident
    getIO().to(`user:${complaint.userId}`).emit("complaint:updated", { complaint });
    res.json(complaint);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
