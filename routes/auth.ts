import { Router, Request, Response, NextFunction } from "express";
import {
    createBasePatient,
    createBaseDoctor,
    verifyUserOTP,
    getUserById,
    completePatientProfile,
    completeDoctorProfile,
    hasCompletedProfile,
} from "../services/userService";
import { sendOTP, verifyOTP, resendOTP } from "../utils/otp";
import { validateBody } from "../middleware/validateBody";
import { userSchemas } from "../utils/validators/user";
import { ICreateDoctor, ICreatePatient, ILogin } from "../types";
import { loginSchema } from "../utils/validators/auth";
import { authenticateUser } from "../services/authService";

const router = Router();

router.post(
    "/register/patient",
    validateBody(userSchemas.patient),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userData = req.body as ICreatePatient;

            const user = await createBasePatient(userData);
            const otpResult = await sendOTP(user.id, "email");

            res.status(201).json({
                success: true,
                message: "Patient registered successfully",
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isVerified: user.isVerified,
                },
                otp: otpResult,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/register/doctor",
    validateBody(userSchemas.doctor),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userData = req.body as ICreateDoctor;

            const user = await createBaseDoctor(userData);
            const otpResult = await sendOTP(user.id, "email");

            res.status(201).json({
                success: true,
                message: "Doctor registered successfully",
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isVerified: user.isVerified,
                },
                otp: otpResult,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/verify-otp",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId, otp } = req.body;

            await verifyOTP(userId, otp);
            const user = await verifyUserOTP(userId);

            res.json({
                success: true,
                message: "OTP verified successfully",
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isVerified: user.isVerified,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/resend-otp",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId, method = "email" } = req.body;

            await resendOTP(userId);
            const otpResult = await sendOTP(userId, method);

            res.json({
                success: true,
                message: "OTP resent successfully",
                otp: otpResult,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/login",
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const loginData: ILogin = req.body;

            const result = await authenticateUser(loginData);

            res.json({
                success: true,
                message: "Login successful",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/complete-profile",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId, password, ...profileData } = req.body;
            const user = await getUserById(userId);
            
            if (!user) {
                throw new Error("User not found");
            }
            if (!user.isVerified) {
                throw new Error("User must verify OTP first");
            }

            let result;
            if (user.role === "PATIENT") {
                result = await completePatientProfile(userId, password, profileData);
                res.json({
                    success: true,
                    message: "Patient profile completed",
                    data: result,
                });
            } else if (user.role === "DOCTOR") {
                result = await completeDoctorProfile(userId, password, profileData);
                res.json({
                    success: true,
                    message: "Doctor profile submitted for approval",
                    data: result,
                });
            }
        } catch (error) {
            next(error);
        }
    }
);


router.get(
    "/profile-status/:userId",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const isComplete = await hasCompletedProfile(userId);

            res.json({
                success: true,
                data: {
                    isComplete,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export { router as authRoutes };
