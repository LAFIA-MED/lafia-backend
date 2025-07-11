import { prisma } from "../config/database";

export const getAllHospitals = async () => {
    const hospitals = await prisma.hospital.findMany({
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
        },
    });

    if (!hospitals)
        return {
            message: "No Hospital found",
        };

    return hospitals;
};
