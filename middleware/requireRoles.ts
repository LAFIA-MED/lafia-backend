import { Response, NextFunction } from "express";
import { ROLE } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types";

export const requireRoles = (allowedRoles: ROLE[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const authHeader = (req.headers as any).authorization;
            
            if (!authHeader) {
                res.status(401).json({ 
                    success: false,
                    message: "Authorization header required" 
                });
                return;
            }

            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : authHeader;

            if (!token) {
                res.status(401).json({ 
                    success: false,
                    message: "Token required" 
                });
                return;
            }

            const decoded = verifyToken(token) as any;

            if (!decoded || !decoded.role) {
                res.status(401).json({ 
                    success: false,
                    message: "Invalid token" 
                });
                return;
            }

            if (!allowedRoles.includes(decoded.role)) {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
                return;
            }

            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
            
            next();
        } catch (error) {
            res.status(401).json({ 
                success: false,
                message: "Invalid token" 
            });
        }
    };
};