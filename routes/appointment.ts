import { Router, Request, Response, NextFunction } from "express";
import { createAppointment } from "../services/appointmentService";
import { validateBody } from "../middleware/validateBody";
import { userSchemas } from "../utils/validators/user";
import { AuthenticatedRequest, ICreateAppointment } from "../types";
import { getUserById } from "../services/userService";

const router = Router();


router.post("/new", validateBody(userSchemas.appointment), async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appointmentData: ICreateAppointment = req.body;
        
        const appointment = await createAppointment(appointmentData);
        const doctor = await getUserById(appointment.doctorId)

        res.status(201).json({
            success: true,
            message: "Appointment Scheduled successfully",
            data: {
                id: appointment.id,
                typeOfCare: appointment.typeOfCare,
                doctor: doctor?.first_name && doctor?.last_name,
                description: appointment.description,
                appointmentType: appointment.appointmentType,
                appointmentDate: appointment.appointmentDate,
                additionalNote: appointment.additionalNote
            }
        });
    } catch (error) {
        next(error);
    }
})


export { router as appointmentsRoutes }