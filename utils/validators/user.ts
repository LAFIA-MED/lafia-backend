import Joi from "joi";
import { GENDER, ROLE } from "@prisma/client";

const baseUserSchema = Joi.object({
    email: Joi.string().email().required(),

    first_name: Joi.string().min(2).required(),
    last_name: Joi.string().min(2).required(),
    gender: Joi.string()
        .valid(...Object.values(GENDER))
        .required(),
    phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required(),
    profile_picture: Joi.string().uri().optional(),
    role: Joi.string()
        .valid(...Object.values(ROLE))
        .required(),
});

const patientSchema = baseUserSchema.keys({
    userId: Joi.string().required(),
    role: Joi.string().valid("PATIENT").required(),
    allergies: Joi.array().items(Joi.string().min(2)).min(0).optional(),
});

const doctorSchema = baseUserSchema.keys({
    userId: Joi.string().required(),
    role: Joi.string().valid("DOCTOR").required(),
    specialization: Joi.string().min(3).required(),
    experience: Joi.number().integer().min(0).required(),
    license: Joi.string()
        .pattern(/^[A-Z]{2}\d{6}$/)
        .required(),
    hospitalId: Joi.string().required(),
});

const adminSchema = baseUserSchema.keys({
    role: Joi.string().valid("ADMIN", "HOSPITAL").required(),
});

const emailSchema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid("PATIENT", "DOCTOR").required(),
});

const otpVerificationSchema = Joi.object({
    userId: Joi.string().required(),
    otp: Joi.string().length(4).pattern(/^[0-9]+$/).required(),
});

const completePatientProfileSchema = Joi.object({
    userId: Joi.string().required(),
    password: Joi.string()
        .min(8)
        .pattern(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])")
        )
        .required(),
    allergies: Joi.array().items(Joi.string().min(2)).min(0).optional(),
    date_of_birth: Joi.date().max(new Date()).required(),
    profile_picture: Joi.string().uri().optional(),
});

const completeDoctorProfileSchema = Joi.object({
    userId: Joi.string().required(),
    password: Joi.string()
        .min(8)
        .pattern(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])")
        )
        .required(),
    specialization: Joi.string().min(3).required(),
    experience: Joi.number().integer().min(0).required(),
    license: Joi.string()
        .pattern(/^[A-Z]{2}\d{6}$/)
        .required(),
    hospitalId: Joi.string().required(),
    date_of_birth: Joi.date().max(new Date()).required(),
    profile_picture: Joi.string().uri().optional(),
});

export const userSchemas = {
    patient: patientSchema,
    doctor: doctorSchema,
    admin: adminSchema,
    base: baseUserSchema,
    email: emailSchema,
    otpVerification: otpVerificationSchema,
    completePatientProfile: completePatientProfileSchema,
    completeDoctorProfile: completeDoctorProfileSchema,
};