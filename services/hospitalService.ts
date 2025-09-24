import { prisma } from "../config/database";

export const getAllHospitals = async () => {
    const hospitals = await prisma.hospital.findMany({
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
        },
    });

    if (hospitals.length === 0) {
        return {
            message: "No hospitals found",
            data: [],
        };
    }

    return {
        message: "Hospitals retrieved successfully",
        data: hospitals,
    };
};

export const getHospitalById = async (hospitalId: string) => {
    const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            license: true,
            created_at: true,
            updated_at: true,
        },
    });

    if (!hospital) {
        throw new Error("Hospital not found");
    }

    return hospital;
};

export const createHospital = async (hospitalData: {
    name: string;
    address: string;
    license: string;
    phone: string;
    email: string;
}) => {
    // Check if hospital with same email, phone, or name already exists
    const existingHospital = await prisma.hospital.findFirst({
        where: {
            OR: [
                { email: hospitalData.email },
                { phone: hospitalData.phone },
                { name: hospitalData.name },
            ],
        },
    });

    if (existingHospital) {
        throw new Error("Hospital with this email, phone, or name already exists");
    }

    const hospital = await prisma.hospital.create({
        data: hospitalData,
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            license: true,
            created_at: true,
            updated_at: true,
        },
    });

    return hospital;
};

export const updateHospital = async (
    hospitalId: string,
    updateData: {
        name?: string;
        address?: string;
        license?: string;
        phone?: string;
        email?: string;
    }
) => {
    // Check if hospital exists
    const existingHospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
    });

    if (!existingHospital) {
        throw new Error("Hospital not found");
    }

    // Check for conflicts if updating email, phone, or name
    if (updateData.email || updateData.phone || updateData.name) {
        const conflictHospital = await prisma.hospital.findFirst({
            where: {
                AND: [
                    { id: { not: hospitalId } },
                    {
                        OR: [
                            ...(updateData.email ? [{ email: updateData.email }] : []),
                            ...(updateData.phone ? [{ phone: updateData.phone }] : []),
                            ...(updateData.name ? [{ name: updateData.name }] : []),
                        ],
                    },
                ],
            },
        });

        if (conflictHospital) {
            throw new Error("Hospital with this email, phone, or name already exists");
        }
    }

    const hospital = await prisma.hospital.update({
        where: { id: hospitalId },
        data: updateData,
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            license: true,
            created_at: true,
            updated_at: true,
        },
    });

    return hospital;
};

export const deleteHospital = async (hospitalId: string) => {
    // Check if hospital exists
    const existingHospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        include: {
            doctors: true,
        },
    });

    if (!existingHospital) {
        throw new Error("Hospital not found");
    }

    // Check if hospital has doctors
    if (existingHospital.doctors.length > 0) {
        throw new Error("Cannot delete hospital with associated doctors");
    }

    await prisma.hospital.delete({
        where: { id: hospitalId },
    });

    return { message: "Hospital deleted successfully" };
};
