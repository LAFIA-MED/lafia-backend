import Joi from "joi";
import { GENDER, ROLE } from "@prisma/client";

// Step 1: Email verification schema
const emailVerificationSchema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid("PATIENT", "DOCTOR", "HOSPITAL").required(),
});

const otpVerificationSchema = Joi.object({
    userId: Joi.string().required(),
    otp: Joi.string().length(4).pattern(/^[0-9]+$/).required(),
});

// Step 2: Base user details schema
const baseUserDetailsSchema = Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(8)
        .pattern(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])")
        )
        .required()
        .messages({
            "string.pattern.base": "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
        }),
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    gender: Joi.string()
        .valid(...Object.values(GENDER))
        .required(),
    phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required()
        .messages({
            "string.pattern.base": "Phone number must be a valid international format",
        }),
    date_of_birth: Joi.date().max(new Date()).required(),
    profile_picture: Joi.string().uri().optional(),
});

// Patient creation schema
const createPatientSchema = baseUserDetailsSchema.keys({
    role: Joi.string().valid("PATIENT").required(),
    allergies: Joi.array().items(Joi.string().min(2).max(100)).min(0).optional(),
});

// Doctor creation schema
const createDoctorSchema = baseUserDetailsSchema.keys({
    role: Joi.string().valid("DOCTOR").required(),
    specialization: Joi.string().min(3).max(100).required(),
    experience: Joi.number().integer().min(0).max(50).required(),
    license: Joi.string()
        .pattern(/^[A-Z]{2}\d{6}$/)
        .required()
        .messages({
            "string.pattern.base": "License must be in format: 2 uppercase letters followed by 6 digits (e.g., AB123456)",
        }),
    hospitalId: Joi.string().required(),
});

// Hospital creation schema
const createHospitalSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    address: Joi.string().min(10).max(500).required(),
    license: Joi.string().min(5).max(50).required(),
    phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required()
        .messages({
            "string.pattern.base": "Phone number must be a valid international format",
        }),
    email: Joi.string().email().required(),
});

// Hospital user creation schema
const createHospitalUserSchema = baseUserDetailsSchema.keys({
    role: Joi.string().valid("HOSPITAL").required(),
    hospitalId: Joi.string().required(),
});

// Update schemas
const updateUserSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string()
        .min(8)
        .pattern(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])")
        )
        .optional(),
    first_name: Joi.string().min(2).max(50).optional(),
    last_name: Joi.string().min(2).max(50).optional(),
    gender: Joi.string()
        .valid(...Object.values(GENDER))
        .optional(),
    phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional(),
    profile_picture: Joi.string().uri().optional(),
    date_of_birth: Joi.date().max(new Date()).optional(),
});

const updatePatientSchema = updateUserSchema.keys({
    allergies: Joi.array().items(Joi.string().min(2).max(100)).min(0).optional(),
});

const updateDoctorSchema = updateUserSchema.keys({
    specialization: Joi.string().min(3).max(100).optional(),
    experience: Joi.number().integer().min(0).max(50).optional(),
    license: Joi.string()
        .pattern(/^[A-Z]{2}\d{6}$/)
        .optional(),
    hospitalId: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    isAvailable: Joi.boolean().optional(),
});

const updateHospitalSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    address: Joi.string().min(10).max(500).optional(),
    license: Joi.string().min(5).max(50).optional(),
    phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional(),
    email: Joi.string().email().optional(),
});

// Resend OTP schema
const resendOTPSchema = Joi.object({
    userId: Joi.string().required(),
    method: Joi.string().valid("email").default("email").optional(),
});

export const userSchemas = {
    // Step 1: Email verification
    emailVerification: emailVerificationSchema,
    otpVerification: otpVerificationSchema,
    resendOTP: resendOTPSchema,
    
    // Step 2: Profile completion
    createPatient: createPatientSchema,
    createDoctor: createDoctorSchema,
    createHospital: createHospitalSchema,
    createHospitalUser: createHospitalUserSchema,
    
    // Update schemas
    updateUser: updateUserSchema,
    updatePatient: updatePatientSchema,
    updateDoctor: updateDoctorSchema,
    updateHospital: updateHospitalSchema,
};