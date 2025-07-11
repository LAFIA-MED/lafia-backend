import Joi from "joi";
import { GENDER, ROLE } from "@prisma/client";

const baseUserSchema = Joi.object({
    email: Joi.string().email().required(),

    password: Joi.string()
        .min(8)
        .pattern(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])")
        )
        .required(),

    first_name: Joi.string().min(2).required(),
    last_name: Joi.string().min(2).required(),

    gender: Joi.string()
        .valid(...Object.values(GENDER))
        .required(),

    phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required(),

    profile_picture: Joi.string().uri().optional(),

    date_of_birth: Joi.date().max(new Date()).required(),

    role: Joi.string()
        .valid(...Object.values(ROLE))
        .required(),
});

const patientSchema = baseUserSchema.keys({
    role: Joi.string().valid("PATIENT").required(),
    allergies: Joi.array().items(Joi.string().min(2)).min(1).required(),
});

const doctorSchema = baseUserSchema.keys({
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

export const userSchemas = {
    patient: patientSchema,
    doctor: doctorSchema,
    admin: adminSchema,
    base: baseUserSchema,
};
