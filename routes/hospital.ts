import { Router, Request, Response, NextFunction } from "express";
import { getAllHospitals } from "../services/hospitalService";

const router = Router();

router.post(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitals = getAllHospitals();

            res.status(201).json({
                success: true,
                ...hospitals,
            });
        } catch (error) {
            next(error);
        }
    }
);

export { router as hospitalRoutes}
