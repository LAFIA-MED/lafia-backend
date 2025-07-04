import Joi from "joi";

export const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().min(8).required(),
});
