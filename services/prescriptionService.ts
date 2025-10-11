import { Prescriptions } from "@prisma/client";
import { prisma } from "../config/database";

export const getAllPrescriptions = async () => {
    const prescriptions = await prisma.prescriptions.findMany({
        select: {
            id: true,
            dosage: true,
            drugs: true,
            frequency: true,
            duration: true,
            notes: true,
            patientId: true,
            doctorId: true,
            created_at: true,
            updated_at: true
        }
    })

    if (prescriptions.length === 0) {
        return {
            message: "No prescriptions found",
            data: [],
        };
    }

    return {
        message: "Prescriptions retrieved successfully",
        data: prescriptions,
    };
}

export const getPrescriptionById = async (prescriptionId: string) => {
    const prescription = await prisma.prescriptions.findUnique({
        where: {
            id: prescriptionId
        },
        select: {
            id: true,
            patient: true,
            doctor: true,
            drugs: true,
            dosage: true,
            frequency: true,
            duration: true,
            notes: true
        }

    })

    if (!prescription) {
        throw new Error("Prescription not found");
    }

    return prescription;

}

export const createPrescription = async (prescriptionData: Prescriptions) => {
    const prescription = await prisma.prescriptions.create({
        data: prescriptionData,
        select: {
            id: true,
            drugs: true,
            dosage: true,
            frequency: true,
            duration: true,
            notes: true,
            patient: true,
            doctor: true,
            created_at: true,
        }
    })

    return prescription
}