import { Response, NextFunction } from "express";
import { ROLE } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types";

export const requireRoles = (allowedRoles: ROLE[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            // const authHeader = req?.headers?.get('authorization') || req?.headers?.get('Authorization');
            const authHeader = req.headers['authorization'] || req.headers['Authorization'];
            const token = typeof authHeader === 'string' ? authHeader.split(" ")[1] : undefined;

            if (!token) {
                res.status(401).json({ message: "No token provided" });
                return;
            }

            const decoded = verifyToken(token) as any;

            if (!allowedRoles.includes(decoded.role)) {
                res.status(403).json({
                    message: "Insufficient permissions",
                });
                return;
            }
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: "Invalid token" });
        }
    };
};
