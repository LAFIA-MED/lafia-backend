import { prisma } from "../config/database";
import {
    ICreateDoctor,
    ICreatePatient,
    ICreateHospital,
    ICreateHospitalUser,
    IUpdateDoctor,
    IUpdatePatient,
    IUpdateHospital,
} from "../types";
import { hashPassword } from "../utils/password";

// Step 1: Create initial user record for email verification
export const createInitialUser = async (email: string, role: string) => {
    return await prisma.user.create({
        data: {
            email,
            role: role.toUpperCase() as any,
            status: "PENDING_VERIFICATION",
            isVerified: false,
            first_name: "",
            last_name: "",
            gender: "MALE" as any,
        },
    });
};

// Step 2: Create patient profile
export const createPatient = async (data: ICreatePatient) => {
    return await prisma.$transaction(async (tx) => {
        // Verify user exists and email matches
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
        
        if (existingUser.role !== "PATIENT") {
            throw new Error("User role does not match");
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Update user with complete details
        const user = await tx.user.update({
            where: { id: data.userId },
            data: {
                password: hashedPassword,
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                date_of_birth: data.date_of_birth,
                profile_picture: data.profile_picture,
                status: "VERIFIED",
                isVerified: true,
            },
        });

        // Create patient record
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

// Step 2: Create doctor profile
export const createDoctor = async (data: ICreateDoctor) => {
    return await prisma.$transaction(async (tx) => {
        // Verify user exists and email matches
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
        
        if (existingUser.role !== "DOCTOR") {
            throw new Error("User role does not match");
        }

        // Verify hospital exists
        const hospital = await tx.hospital.findUnique({
            where: { id: data.hospitalId },
        });
        
        if (!hospital) {
            throw new Error("Hospital not found");
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Update user with complete details
        const user = await tx.user.update({
            where: { id: data.userId },
            data: {
                password: hashedPassword,
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                date_of_birth: data.date_of_birth,
                profile_picture: data.profile_picture,
                status: "PENDING_APPROVAL",
                isVerified: true,
            },
        });

        // Create doctor record
        await tx.doctor.upsert({
            where: { userId: data.userId },
            update: {
                specialization: data.specialization,
                experience: data.experience,
                license: data.license,
                hospitalId: data.hospitalId,
                isActive: false,
                isAvailable: false,
            },
            create: {
                userId: user.id,
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

// Step 2: Create hospital
export const createHospital = async (data: ICreateHospital) => {
    return await prisma.$transaction(async (tx) => {
        // Check if hospital with same email or phone already exists
        const existingHospital = await tx.hospital.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phone: data.phone },
                    { name: data.name },
                ],
            },
        });

        if (existingHospital) {
            throw new Error("Hospital with this email, phone, or name already exists");
        }

        // Create hospital
        const hospital = await tx.hospital.create({
            data: {
                name: data.name,
                address: data.address,
                license: data.license,
                phone: data.phone,
                email: data.email,
            },
        });

        return hospital;
    });
};

export const createHospitalUser = async (data: ICreateHospitalUser) => {
    return await prisma.$transaction(async (tx) => {
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
        
        if (existingUser.role !== "HOSPITAL") {
            throw new Error("User role does not match");
        }

        // Verify hospital exists
        const hospital = await tx.hospital.findUnique({
            where: { id: data.hospitalId },
        });
        
        if (!hospital) {
            throw new Error("Hospital not found");
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Update user with complete details
        const user = await tx.user.update({
            where: { id: data.userId },
            data: {
                password: hashedPassword,
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                phone: data.phone,
                date_of_birth: data.date_of_birth,
                profile_picture: data.profile_picture,
                status: "VERIFIED",
                isVerified: true,
            },
        });

        // Create hospital user record
        await tx.hospitalUser.upsert({
            where: { userId: data.userId },
            update: {
                hospitalId: data.hospitalId,
            },
            create: {
                userId: user.id,
                hospitalId: data.hospitalId,
            },
        });

        return user;
    });
};

// Email verification
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

// Check if profile is complete
export const hasCompletedProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            Patient: true,
            Doctor: true,
            HospitalUser: true,
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
    } else if (user.role === "HOSPITAL") {
        return !!user.HospitalUser && user.status === "VERIFIED" && !!user.password;
    }

    return false;
};

// Update user profile
export const updateUser = async (
    userId: string,
    data: IUpdatePatient | IUpdateDoctor
) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            include: {
                Patient: true,
                Doctor: true,
                HospitalUser: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Update base user fields
        const updateData: any = {};
        if (data.email) updateData.email = data.email;
        if (data.first_name) updateData.first_name = data.first_name;
        if (data.last_name) updateData.last_name = data.last_name;
        if (data.gender) updateData.gender = data.gender;
        if (data.phone) updateData.phone = data.phone;
        if (data.profile_picture) updateData.profile_picture = data.profile_picture;
        if (data.date_of_birth) updateData.date_of_birth = data.date_of_birth;

        // Hash password if provided
        if (data.password) {
            updateData.password = await hashPassword(data.password);
        }

        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                Patient: true,
                Doctor: true,
                HospitalUser: true,
            },
        });

        // Update role-specific fields
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
            const doctorUpdateData: any = {};
            if (doctorData.specialization) doctorUpdateData.specialization = doctorData.specialization;
            if (doctorData.experience !== undefined) doctorUpdateData.experience = doctorData.experience;
            if (doctorData.license) doctorUpdateData.license = doctorData.license;
            if (doctorData.hospitalId) doctorUpdateData.hospitalId = doctorData.hospitalId;
            if (doctorData.isActive !== undefined) doctorUpdateData.isActive = doctorData.isActive;
            if (doctorData.isAvailable !== undefined) doctorUpdateData.isAvailable = doctorData.isAvailable;

            if (Object.keys(doctorUpdateData).length > 0) {
                await tx.doctor.update({
                    where: { userId },
                    data: doctorUpdateData,
                });
            }
        }

        return updatedUser;
    });
};

// Get user by ID
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
            HospitalUser: {
                include: {
                    hospital: true,
                },
            },
        },
    });
};

// Find user by email
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
            status: true,
        },
    });
};

// Get all hospitals
export const getAllHospitals = async () => {
    return await prisma.hospital.findMany({
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
        },
    });
};

// Get hospital by ID
export const getHospitalById = async (hospitalId: string) => {
    return await prisma.hospital.findUnique({
        where: { id: hospitalId },
    });
};