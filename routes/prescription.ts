import { Router, Request, Response, NextFunction } from "express";
import { requireRoles } from "../middleware/requireRoles";
import { ROLE } from "@prisma/client";
import { validateBody } from "../middleware/validateBody";
import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
} from "../services/prescriptionService";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAllPrescriptions();
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:prescriptionId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prescriptionId } = req.params;
      const prescription = await getPrescriptionById(prescriptionId);

      res.status(200).json({
        success: true,
        message: "Hospital retrieved successfully",
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  requireRoles([ROLE.DOCTOR]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prescription = await createPrescription(req.body);

      res.status(201).json({
        success: true,
        message: "Prescription created successfully",
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as prescriptionRoutes };
