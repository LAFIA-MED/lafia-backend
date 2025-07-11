import { GENDER, ROLE } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: ROLE;
    };
}

export interface ILogin {
    email: string;
    password: string;
}

export interface ICreateUser {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    gender: GENDER;
    phone: string;
    role: ROLE;
    profile_picture?: string;
    date_of_birth: Date;
}

export interface ICreatePatient extends ICreateUser {
    allergies: string[];
}

export interface ICreateDoctor extends ICreateUser {
    specialization: string;
    experience: number;
    license: string;
    hospitalId: string;
}

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
