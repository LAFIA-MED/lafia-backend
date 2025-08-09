import { prisma } from "../config/database";
import { ICreateAppointment } from "../types";

export const createAppointment = async (data: ICreateAppointment) => {
    return await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
            data: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                typeOfCare: data.typeOfCare,
                description: data.description,
                appointmentType: data.appointmentType,
                appointmentDate: data.appointmentDate,
                additionalNote: data.additionalNote
            },
        });

        return appointment
    })
}
