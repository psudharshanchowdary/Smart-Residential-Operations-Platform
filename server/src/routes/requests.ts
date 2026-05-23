import { Router, Request, Response } from "express";
import { MaintenanceRequest } from "../models/MaintenanceRequest";
import { verifyToken, requireAdmin } from "../middleware/auth";
import { getIO } from "../socket/events";

const router = Router();

// GET /api/requests — resident gets own; admin gets all
router.get("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const query =
      req.user!.role === "admin" ? {} : { userId: req.user!.id };
    const requests = await MaintenanceRequest.find(query).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/requests — resident creates a new request
router.post("/", verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, priority, description, unit, title, image } = req.body;
    if (!category || !description) {
      res.status(400).json({ message: "Category and description are required" });
      return;
    }

    const request = await MaintenanceRequest.create({
      userId: req.user!.id,
      userName: req.user!.name,
      unit: unit || `Apt ${req.user!.id}`,
      title: title || `${category} Issue`,
      category,
      priority: priority || "Medium",
      description,
      status: "Pending",
      image: image || "",
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id — admin updates status / adminNote
router.patch("/:id", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, adminNote } = req.body;
    const updated = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(adminNote !== undefined && { adminNote }) },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    // Emit real-time event to the resident's room
    getIO().to(`user:${updated.userId.toString()}`).emit("request:updated", {
      requestId: updated._id.toString(),
      status: updated.status,
      adminNote: updated.adminNote,
      title: updated.title,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/requests/:id/assign-tech — admin assigns a technician
router.patch("/:id/assign-tech", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { technicianName, technicianId, technicianPhone } = req.body;
    if (!technicianName || !technicianId || !technicianPhone) {
      res.status(400).json({ message: "technicianName, technicianId and technicianPhone are all required" });
      return;
    }

    const updated = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      {
        technicianName,
        technicianId,
        technicianPhone,
        technicianAssignedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    // Notify the resident in real-time
    try {
      getIO().to(`user:${updated.userId.toString()}`).emit("request:updated", {
        requestId: updated._id.toString(),
        status: updated.status,
        adminNote: updated.adminNote,
        title: updated.title,
        technicianName: updated.technicianName,
      });
    } catch (_) { /* socket may not be init yet */ }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/requests/:id/image — admin removes the attached image
router.delete("/:id/image", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ message: "Request not found" });
      return;
    }
    if (!request.image) {
      res.status(400).json({ message: "No image attached to this request" });
      return;
    }

    request.image = "";
    await request.save();

    // Notify the resident in real-time
    try {
      getIO().to(`user:${request.userId.toString()}`).emit("request:updated", {
        requestId: request._id.toString(),
        status: request.status,
        adminNote: request.adminNote,
        title: request.title,
      });
    } catch (_) { /* socket may not be up yet */ }

    res.json({ message: "Image deleted", request });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/requests/:id — admin only
router.delete("/:id", verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await MaintenanceRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
