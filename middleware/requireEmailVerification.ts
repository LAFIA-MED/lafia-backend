import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/userService";

// Middleware to check email verification status
export const requireEmailVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "User ID is required",
            });
            return;
        }
        
        const user = await getUserById(userId);
        if (!user) {
            res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
            return;
        }
        
        if (!user.isVerified) {
            res.status(403).json({
                success: false,
                message: "Email verification required",
            });
            return;
        }
        
        next();
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};