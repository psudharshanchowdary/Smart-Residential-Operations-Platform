import { Router, Request, Response } from "express";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { verifyToken, requireAdmin } from "../middleware/auth";
import { getIO } from "../socket/events";

const router = Router();

// GET /api/payments — resident gets own; admin gets all
router.get("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const query =
      req.user!.role === "admin" ? {} : { userId: req.user!.id };
    const payments = await Payment.find(query).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/payments — admin creates payment request for a resident
router.post("/", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount, dueDate, description } = req.body;
    if (!userId || !amount || !dueDate) {
      res.status(400).json({ message: "userId, amount, and dueDate are required" });
      return;
    }

    const resident = await User.findById(userId);
    if (!resident) {
      res.status(404).json({ message: "Resident not found" });
      return;
    }

    const payment = await Payment.create({
      userId,
      userName: resident.name,
      unit: `Unit ${resident.unit}, ${resident.building}`,
      amount: parseFloat(amount),
      dueDate,
      description: description || "Maintenance Fee",
      status: "Pending",
    });

    // Notify the resident in real-time
    getIO().to(`user:${userId}`).emit("payment:created", { payment });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/payments/:id — resident pays (marks as Paid)
router.patch("/:id", verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, transactionId, paymentDate, paymentMethod } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    // Residents can only update their own payments
    if (req.user!.role === "resident" && payment.userId.toString() !== req.user!.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(transactionId && { transactionId }),
        ...(paymentDate && { paymentDate }),
        ...(paymentMethod && { paymentMethod }),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
