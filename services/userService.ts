import { prisma } from "../config/database";
import {
    ICreateDoctor,
    ICreatePatient,
    IUpdateDoctor,
    IUpdatePatient,
} from "../types";
import { hashPassword } from "../utils/password";

/**
 * Creates a new patient user with basic Patient record
 */
export const createBasePatient = async (data: ICreatePatient) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: data.email,
                password: "",
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                role: "PATIENT",
                status: "PENDING_VERIFICATION",
                isVerified: false,
            },
        });

        await tx.patient.create({
            data: {
                userId: user.id,
                allergies: [],
            },
        });

        return user;
    });
};

/**
 * Creates a new doctor user with basic Doctor record
 */
export const createBaseDoctor = async (data: ICreateDoctor) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: data.email,
                password: "",
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                role: "DOCTOR",
                status: "PENDING_VERIFICATION",
                isVerified: false,
            },
        });

        await tx.doctor.create({
            data: {
                userId: user.id,
                hospitalId: data.hospitalId,
                specialization: "",
                experience: 0,
                license: "",
                isActive: false,
                isAvailable: false,
            },
        });

        return user;
    });
};

/**
 * Complete patient profile after OTP verification
 */
export const completePatientProfile = async (
    userId: string,
    password: string,
    data: {
        allergies?: string[];
        date_of_birth?: Date;
        profile_picture?: string;
    }
) => {
    const hashedPassword = await hashPassword(password);
    return await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                status: "VERIFIED",
                date_of_birth: data.date_of_birth,
                profile_picture: data.profile_picture,
            },
        });

        const patient = await tx.patient.update({
            where: { userId: userId },
            data: {
                allergies: data.allergies || [],
            },
        });

        return patient;
    });
};

export const completeDoctorProfile = async (
    userId: string,
    password: string,
    data: {
        specialization: string;
        experience: number;
        license: string;
        date_of_birth?: Date;
        profile_picture?: string;
        hospitalId: string;
    }
) => {
    const hashedPassword = await hashPassword(password);
    return await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                status: "PENDING_APPROVAL",
                date_of_birth: data.date_of_birth,
                profile_picture: data.profile_picture,
            },
        });

        const doctor = await tx.doctor.update({
            where: { userId: userId },
            data: {
                specialization: data.specialization,
                experience: data.experience,
                license: data.license,
                isActive: false,
                isAvailable: false,
                hospitalId: data.hospitalId,
            },
        });

        return doctor;
    });
};

/**
 * Verify OTP and update user status
 */
export const verifyUserOTP = async (userId: string, password?: string) => {
    return await prisma.user.update({
        where: { id: userId },
        data: {
            isVerified: true,
            status: "VERIFIED",
            ...(password && { password }),
        },
    });
};

/**
 * Check if user has completed their profile
 */
export const hasCompletedProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            Patient: true,
            Doctor: true,
        },
    });

    if (!user) return false;

    if (user.role === "PATIENT") {
        return !!user.Patient && user.status === "VERIFIED";
    } else if (user.role === "DOCTOR") {
        return (
            !!user.Doctor &&
            user.Doctor.specialization !== "" &&
            user.Doctor.license !== "" &&
            (user.status === "VERIFIED" ||
                user.status === "PENDING_APPROVAL" ||
                user.status === "APPROVED")
        );
    }

    return false;
};

/**
 * Updates a user and their associated role data
 */
export const updateUser = async (
    userId: string,
    data: IUpdatePatient | IUpdateDoctor
) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: userId },
            data: {
                email: data.email,
                password: data.password,
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                profile_picture: data.profile_picture,
                date_of_birth: data.date_of_birth,
            },
            include: {
                Patient: true,
                Doctor: true,
            },
        });

        if (user.role === "PATIENT" && user.Patient) {
            const patientData = data as IUpdatePatient;
            if (patientData.allergies) {
                await tx.patient.update({
                    where: { userId },
                    data: {
                        allergies: patientData.allergies,
                    },
                });
            }
        } else if (user.role === "DOCTOR" && user.Doctor) {
            const doctorData = data as IUpdateDoctor;
            await tx.doctor.update({
                where: { userId },
                data: {
                    specialization: doctorData.specialization,
                    experience: doctorData.experience,
                    license: doctorData.license,
                    hospitalId: doctorData.hospitalId,
                    isActive: doctorData.isActive,
                    isAvailable: doctorData.isAvailable,
                },
            });
        }

        return user;
    });
};

/**
 * Gets a user by ID with their role-specific data
 */
export const getUserById = async (userId: string) => {
    return await prisma.user.findUnique({
        where: { id: userId },
        include: {
            Patient: true,
            Doctor: {
                include: {
                    Hospital: true,
                },
            },
        },
    });
};

export const findUserByEmail = async (email: string) => {
    if (!email) {
        throw new Error("Email is required");
    }

    const member = await prisma.user.findUnique({
        where: {
            email: email,
        },
        select: {
            id: true,
            email: true,
            role: true,
            password: true,
        },
    });

    return member;
};
