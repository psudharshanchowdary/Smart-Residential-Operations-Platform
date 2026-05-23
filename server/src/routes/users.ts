import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { verifyToken, requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/users/residents — admin only, returns list of residents
router.get("/residents", verifyToken, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const residents = await User.find({ role: "resident" }).select("-passwordHash");
    res.json(
      residents.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        unit: u.unit,
        building: u.building,
        avatar: u.avatar || "",
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
