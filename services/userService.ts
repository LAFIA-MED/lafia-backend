import { prisma } from "../config/database";
import {
    ICreateDoctor,
    ICreatePatient,
    IUpdateDoctor,
    IUpdatePatient,
} from "../types";
import { hashPassword } from "../utils/password";

export const createBasePatient = async (data: ICreatePatient) => {
    return await prisma.$transaction(async (tx) => {
        // Check if user exists and email matches
        const existingUser = await tx.user.findUnique({
            where: { id: data.userId },
        });
        if (!existingUser) {
            throw new Error("User not found");
        }
        if (existingUser.email !== data.email) {
            throw new Error("Email does not match the user record");
        }
        if (!existingUser.isVerified) {
            throw new Error("Email verification required");
        }

        // Update existing user
        const user = await tx.user.update({
            where: { id: data.userId },
            data: {
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                role: "PATIENT",
                status: "PENDING_VERIFICATION",
                isVerified: true,
            },
        });

        // Create or update patient record
        await tx.patient.upsert({
            where: { userId: data.userId },
            update: {
                allergies: data.allergies || [],
            },
            create: {
                userId: user.id,
                allergies: data.allergies || [],
            },
        });

        return user;
    });
};

export const createBaseDoctor = async (data: ICreateDoctor) => {
    return await prisma.$transaction(async (tx) => {
        // Check if user exists and email matches
        const existingUser = await tx.user.findUnique({
            where: { id: data.userId },
        });
        if (!existingUser) {
            throw new Error("User not found");
        }
        if (existingUser.email !== data.email) {
            throw new Error("Email does not match the user record");
        }
        if (!existingUser.isVerified) {
            throw new Error("Email verification required");
        }

        // Update existing user
        const user = await tx.user.update({
            where: { id: data.userId },
            data: {
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                role: "DOCTOR",
                status: "PENDING_VERIFICATION",
                isVerified: true,
            },
        });

        // Create or update doctor record
        await tx.doctor.upsert({
            where: { userId: data.userId },
            update: {
                hospitalId: data.hospitalId,
                specialization: data.specialization,
                experience: data.experience,
                license: data.license,
                isActive: false,
                isAvailable: false,
            },
            create: {
                userId: user.id,
                hospitalId: data.hospitalId,
                specialization: data.specialization,
                experience: data.experience,
                license: data.license,
                isActive: false,
                isAvailable: false,
            },
        });

        return user;
    });
};

export const completePatientProfile = async (
    userId: string,
    password: string,
    data: {
        allergies?: string[];
        date_of_birth: Date;
        profile_picture?: string;
    }
) => {
    const hashedPassword = await hashPassword(password);
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                status: "VERIFIED",
                date_of_birth: data.date_of_birth,
                profile_picture: data.profile_picture,
            },
        });

        await tx.patient.update({
            where: { userId: userId },
            data: {
                allergies: data.allergies || [],
            },
        });

        return user;
    });
};

export const completeDoctorProfile = async (
    userId: string,
    password: string,
    data: {
        specialization: string;
        experience: number;
        license: string;
        date_of_birth: Date;
        profile_picture?: string;
        hospitalId: string;
    }
) => {
    const hashedPassword = await hashPassword(password);
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                status: "PENDING_APPROVAL",
                date_of_birth: data.date_of_birth,
                profile_picture: data.profile_picture,
            },
        });

        await tx.doctor.update({
            where: { userId: userId },
            data: {
                specialization: data.specialization,
                experience: data.experience,
                license: data.license,
                hospitalId: data.hospitalId,
                isActive: false,
                isAvailable: false,
            },
        });

        return user;
    });
};

export const verifyUserOTP = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }
    if (user.isVerified) {
        throw new Error("Email already verified");
    }

    return await prisma.user.update({
        where: { id: userId },
        data: {
            isVerified: true,
            status: "VERIFIED",
        },
    });
};

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
        return !!user.Patient && user.status === "VERIFIED" && !!user.password;
    } else if (user.role === "DOCTOR") {
        return (
            !!user.Doctor &&
            user.Doctor.specialization !== "" &&
            user.Doctor.license !== "" &&
            !!user.password &&
            (user.status === "VERIFIED" ||
                user.status === "PENDING_APPROVAL" ||
                user.status === "APPROVED")
        );
    }

    return false;
};

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

export const getUserById = async (userId: string) => {
    if (!userId) {
        throw new Error("User ID is required");
    }
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

    return await prisma.user.findUnique({
        where: {
            email: email,
        },
        select: {
            id: true,
            email: true,
            role: true,
            password: true,
            isVerified: true,
        },
    });
};