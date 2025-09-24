import { Router, Request, Response, NextFunction } from "express";
import { 
    getUserById, 
    updateUser, 
    hasCompletedProfile 
} from "../services/userService";
import { validateBody } from "../middleware/validateBody";
import { userSchemas } from "../utils/validators/user";
import { requireRoles } from "../middleware/requireRoles";
import { ROLE } from "@prisma/client";
import { AuthenticatedRequest } from "../types";

const router = Router();

// Get user profile (authenticated user can get their own profile)
router.get(
    "/profile",
    requireRoles([ROLE.PATIENT, ROLE.DOCTOR, ROLE.HOSPITAL, ROLE.ADMIN]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const user = await getUserById(req.user.id);
            
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "User profile retrieved successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get user by ID (admin only)
router.get(
    "/:userId",
    requireRoles([ROLE.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const user = await getUserById(userId);
            
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update user profile (authenticated user can update their own profile)
router.put(
    "/profile",
    requireRoles([ROLE.PATIENT, ROLE.DOCTOR, ROLE.HOSPITAL, ROLE.ADMIN]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            // Determine which schema to use based on user role
            let schema;
            switch (req.user.role) {
                case ROLE.PATIENT:
                    schema = userSchemas.updatePatient;
                    break;
                case ROLE.DOCTOR:
                    schema = userSchemas.updateDoctor;
                    break;
                default:
                    schema = userSchemas.updateUser;
            }

            // Validate request body
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
                allowUnknown: false,
            });

            if (error) {
                const errorMessages = error.details.map((detail) => ({
                    field: detail.path.join("."),
                    message: detail.message.replace(/"/g, ""),
                }));
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: errorMessages,
                });
                return;
            }

            const updatedUser = await updateUser(req.user.id, value);

            res.status(200).json({
                success: true,
                message: "User profile updated successfully",
                data: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update user by ID (admin only)
router.put(
    "/:userId",
    requireRoles([ROLE.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            
            // Get user to determine role for validation
            const existingUser = await getUserById(userId);
            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            // Determine which schema to use based on user role
            let schema;
            switch (existingUser.role) {
                case ROLE.PATIENT:
                    schema = userSchemas.updatePatient;
                    break;
                case ROLE.DOCTOR:
                    schema = userSchemas.updateDoctor;
                    break;
                default:
                    schema = userSchemas.updateUser;
            }

            // Validate request body
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
                allowUnknown: false,
            });

            if (error) {
                const errorMessages = error.details.map((detail) => ({
                    field: detail.path.join("."),
                    message: detail.message.replace(/"/g, ""),
                }));
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: errorMessages,
                });
                return;
            }

            const updatedUser = await updateUser(userId, value);

            res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Check profile completion status
router.get(
    "/profile-status/:userId",
    requireRoles([ROLE.PATIENT, ROLE.DOCTOR, ROLE.HOSPITAL, ROLE.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const isComplete = await hasCompletedProfile(userId);

            res.status(200).json({
                success: true,
                message: "Profile status retrieved successfully",
                data: {
                    isComplete,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export { router as userRoutes };
