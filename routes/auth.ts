import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import {
    createInitialUser,
    createPatient,
    createDoctor,
    createHospital,
    createHospitalUser,
    verifyUserOTP,
    getUserById,
    hasCompletedProfile,
} from "../services/userService";
import { sendOTP, verifyOTP, resendOTP } from "../utils/otp";
import { validateBody } from "../middleware/validateBody";
import { requireEmailVerification } from "../middleware/requireEmailVerification";
import { userSchemas } from "../utils/validators/user";
import { loginSchema } from "../utils/validators/auth";
import { authenticateUser } from "../services/authService";
import { IEmailVerification, IOTPVerification, ICreatePatient, ICreateDoctor, ICreateHospital, ICreateHospitalUser } from "../types";

const router = Router();

// Step 1: Submit email and generate OTP
router.post(
    "/submit-email",
    validateBody(userSchemas.emailVerification),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, role } = req.body as IEmailVerification;

            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                if (existingUser.isVerified) {
                    res.status(400).json({
                        success: false,
                        message: "Email already verified and registered",
                    });
                    return;
                }
                // Resend OTP for unverified user
                const otpResult = await sendOTP(existingUser.id, "email");
                res.status(200).json({
                    success: true,
                    message: "OTP sent successfully",
                    data: {
                        userId: existingUser.id,
                        email: existingUser.email,
                        role: existingUser.role,
                    },
                    otp: otpResult.otp, // Remove in production
                });
                return;
            }

            // Create initial user record
            const user = await createInitialUser(email, role);
            const otpResult = await sendOTP(user.id, "email");

            res.status(201).json({
                success: true,
                message: "Email submitted successfully, OTP sent",
                data: {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                },
                otp: otpResult.otp, // Remove in production
            });
        } catch (error) {
            next(error);
        }
    }
);

// Step 1: Verify email with OTP
router.post(
    "/verify-email",
    validateBody(userSchemas.otpVerification),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId, otp } = req.body as IOTPVerification;

            const user = await getUserById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }
            if (user.isVerified) {
                res.status(400).json({
                    success: false,
                    message: "Email already verified",
                });
                return;
            }

            await verifyOTP(userId, otp);
            const updatedUser = await verifyUserOTP(userId);

            res.json({
                success: true,
                message: "Email verified successfully",
                data: {
                    userId: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isVerified: updatedUser.isVerified,
                },
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "Invalid or expired OTP",
            });
        }
    }
);

// Step 1: Resend OTP
router.post(
    "/resend-otp",
    validateBody(userSchemas.resendOTP),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId, method = "email" } = req.body;

            const user = await getUserById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }
            if (user.isVerified) {
                res.status(400).json({
                    success: false,
                    message: "Email already verified",
                });
                return;
            }

            const otp = await resendOTP(userId);

            res.json({
                success: true,
                message: "OTP resent successfully",
                otp: otp, // Remove in production
            });
        } catch (error) {
            next(error);
        }
    }
);

// Step 2: Create patient profile
router.post(
    "/create-patient",
    validateBody(userSchemas.createPatient),
    requireEmailVerification,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userData = req.body as ICreatePatient;
            const user = await createPatient(userData);

            res.status(201).json({
                success: true,
                message: "Patient profile created successfully",
                data: {
                    userId: user.id,
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

// Step 2: Create doctor profile
router.post(
    "/create-doctor",
    validateBody(userSchemas.createDoctor),
    requireEmailVerification,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userData = req.body as ICreateDoctor;
            const user = await createDoctor(userData);

            res.status(201).json({
                success: true,
                message: "Doctor profile created successfully",
                data: {
                    userId: user.id,
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

// Step 2: Create hospital (separate from hospital user)
router.post(
    "/create-hospital",
    validateBody(userSchemas.createHospital),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalData = req.body as ICreateHospital;
            const hospital = await createHospital(hospitalData);

            res.status(201).json({
                success: true,
                message: "Hospital created successfully",
                data: {
                    hospitalId: hospital.id,
                    name: hospital.name,
                    email: hospital.email,
                    phone: hospital.phone,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Step 2: Create hospital user profile
router.post(
    "/create-hospital-user",
    validateBody(userSchemas.createHospitalUser),
    requireEmailVerification,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userData = req.body as ICreateHospitalUser;
            const user = await createHospitalUser(userData);

            res.status(201).json({
                success: true,
                message: "Hospital user profile created successfully",
                data: {
                    userId: user.id,
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

// Login
router.post(
    "/login",
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await authenticateUser(req.body);

            res.json({
                success: true,
                message: "Login successful",
                ...result,
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                message: error.message || "Invalid credentials",
            });
        }
    }
);

// Profile status
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