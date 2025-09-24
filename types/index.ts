import { Request } from "express";
import { GENDER, ROLE } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: ROLE;
    };
}

// Step 1: Email verification interfaces
export interface IEmailVerification {
    email: string;
    role: ROLE;
}

export interface IOTPVerification {
    userId: string;
    otp: string;
}

// Step 2: Profile completion interfaces
export interface IBaseUserDetails {
    userId: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    gender: GENDER;
    phone: string;
    date_of_birth: Date;
    profile_picture?: string;
}

export interface ICreatePatient extends IBaseUserDetails {
    role: "PATIENT";
    allergies: string[];
}

export interface ICreateDoctor extends IBaseUserDetails {
    role: "DOCTOR";
    specialization: string;
    experience: number;
    license: string;
    hospitalId: string;
}

export interface ICreateHospital {
    name: string;
    address: string;
    license: string;
    phone: string;
    email: string;
}

export interface ICreateHospitalUser extends IBaseUserDetails {
    role: "HOSPITAL";
    hospitalId: string;
}

// Update interfaces
export interface IUpdateUser {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    gender?: GENDER;
    phone?: string;
    profile_picture?: string;
    date_of_birth?: Date;
}

export interface IUpdatePatient extends IUpdateUser {
    allergies?: string[];
}

export interface IUpdateDoctor extends IUpdateUser {
    specialization?: string;
    experience?: number;
    license?: string;
    hospitalId?: string;
    isActive?: boolean;
    isAvailable?: boolean;
}

export interface IUpdateHospital {
    name?: string;
    address?: string;
    license?: string;
    phone?: string;
    email?: string;
}

// Login interface
export interface ILogin {
    email: string;
    password: string;
}

// Response interfaces
export interface IAuthResponse {
    success: boolean;
    message: string;
    data?: any;
    token?: string;
    user?: {
        id: string;
        email: string;
        role: ROLE;
    };
}

export interface IUserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    gender: GENDER;
    phone: string;
    role: ROLE;
    status: string;
    isVerified: boolean;
    profile_picture?: string;
    date_of_birth?: Date;
    created_at: Date;
    updated_at: Date;
}
