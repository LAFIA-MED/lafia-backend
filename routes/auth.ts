import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
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
import { GENDER } from "@prisma/client";

const router = Router();

// Middleware to check email verification status
const requireEmailVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Email verification required",
            });
        }
        next();
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

// Submit email and generate OTP
router.post(
    "/submit-email",
    validateBody(userSchemas.email),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, role } = req.body;

            if (!["PATIENT", "DOCTOR"].includes(role)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role. Must be PATIENT or DOCTOR",
                });
                return;
            }

            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                if (existingUser.isVerified) {
                    res.status(400).json({
                        success: false,
                        message: "Email already verified",
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
                    otp: otpResult.otp,
                });
                return;
            }

            // Create minimal user record
            const user = await prisma.user.create({
                data: {
                    email,
                    role: role.toUpperCase(),
                    password: "",
                    first_name: "",
                    last_name: "",
                    gender: GENDER.MALE, // Temporary default
                    phone: "",
                    status: "PENDING_VERIFICATION",
                    isVerified: false,
                },
            });

            const otpResult = await sendOTP(user.id, "email");

            res.status(201).json({
                success: true,
                message: "Email submitted successfully, OTP sent",
                data: {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                },
                otp: otpResult.otp,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Verify email with OTP
router.post(
    "/verify-email",
    validateBody(userSchemas.otpVerification),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId, otp } = req.body;

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

// Register patient (post-verification)
router.post(
    "/register/patient",
    validateBody(userSchemas.patient),
    requireEmailVerification,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userData = req.body as ICreatePatient;
            const user = await createBasePatient(userData);

            res.status(201).json({
                success: true,
                message: "Patient registration initiated",
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

// Register doctor (post-verification)
router.post(
    "/register/doctor",
    validateBody(userSchemas.doctor),
    requireEmailVerification,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userData = req.body as ICreateDoctor;
            const user = await createBaseDoctor(userData);

            res.status(201).json({
                success: true,
                message: "Doctor registration initiated",
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

// Resend OTP
router.post(
    "/resend-otp",
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
                otp,
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
            const loginData: ILogin = req.body;

            const user = await prisma.user.findUnique({
                where: { email: loginData.email },
            });
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: "Invalid credentials",
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

            const result = await authenticateUser(loginData);

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

// Complete profile
router.post(
    "/complete-profile",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log("Request body:", req.body);
            const { userId, password, ...profileData } = req.body;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: '"userId" is required',
                });
                return;
            }
            const user = await getUserById(userId);

            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            let result;
            if (user.role === "PATIENT") {
                const validatedData = await userSchemas.completePatientProfile.validateAsync({
                        userId,
                        password,
                        ...profileData,
                    },
                    { abortEarly: false }
                );
                result = await completePatientProfile(userId, password, validatedData);
                res.json({
                    success: true,
                    message: "Patient profile completed",
                    data: result,
                });
            } else if (user.role === "DOCTOR") {
                const validatedData = await userSchemas.doctor.validateAsync({
                        userId,
                        password,
                    ...profileData,
                },
                { abortEarly: false }
            );
                result = await completeDoctorProfile(userId, password, validatedData);
                res.json({
                    success: true,
                    message: "Doctor profile submitted for approval",
                    data: result,
                });
            } else {
                res.status(400).json({ success: false, message: "Invalid role" });
            }
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "Profile completion failed",
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