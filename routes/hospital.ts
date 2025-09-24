import { Router, Request, Response, NextFunction } from "express";
import { 
    getAllHospitals, 
    getHospitalById, 
    createHospital, 
    updateHospital, 
    deleteHospital 
} from "../services/hospitalService";
import { validateBody } from "../middleware/validateBody";
import { userSchemas } from "../utils/validators/user";
import { requireRoles } from "../middleware/requireRoles";
import { ROLE } from "@prisma/client";

const router = Router()

router.get(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await getAllHospitals();
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    "/:hospitalId",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { hospitalId } = req.params;
            const hospital = await getHospitalById(hospitalId);
            
            res.status(200).json({
                success: true,
                message: "Hospital retrieved successfully",
                data: hospital,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/",
    requireRoles([ROLE.ADMIN]),
    validateBody(userSchemas.createHospital),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospital = await createHospital(req.body);
            
            res.status(201).json({
                success: true,
                message: "Hospital created successfully",
                data: hospital,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.put(
    "/:hospitalId",
    requireRoles([ROLE.ADMIN]),
    validateBody(userSchemas.updateHospital),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { hospitalId } = req.params;
            const hospital = await updateHospital(hospitalId, req.body);
            
            res.status(200).json({
                success: true,
                message: "Hospital updated successfully",
                data: hospital,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.delete(
    "/:hospitalId",
    requireRoles([ROLE.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { hospitalId } = req.params;
            const result = await deleteHospital(hospitalId);
            
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
);

export { router as hospitalRoutes };
