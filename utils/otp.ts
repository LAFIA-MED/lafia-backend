import crypto from "crypto";
import { prisma } from "../config/database";

export const generateSecureOTP = (): string => {
    const buffer = crypto.randomBytes(2);
    const otp = (buffer.readUInt16BE(0) % 9000) + 1000;
    return otp.toString();
};

export const storeOTP = async (
    userId: string,
    otp: string,
    expiresInMinutes: number = 10
) => {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    return await prisma.oTP.create({
        data: {
            userId,
            code: otp,
            expiresAt,
            isUsed: false,
        },
    });
};

export const verifyOTP = async (userId: string, inputOTP: string) => {
    await cleanupExpiredOTPs();

    const otpRecord = await prisma.oTP.findFirst({
        where: {
            userId,
            code: inputOTP,
            isUsed: false,
            expiresAt: {
                gt: new Date(),
            },
        },
    });

    if (!otpRecord) {
        throw new Error("Invalid or expired OTP");
    }

    await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
    });

    return true;
};

export const cleanupExpiredOTPs = async () => {
    return await prisma.oTP.deleteMany({
        where: {
            OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }],
        },
    });
};

export const resendOTP = async (userId: string) => {
    await prisma.oTP.updateMany({
        where: { userId },
        data: { isUsed: true },
    });

    const newOTP = generateSecureOTP();
    await storeOTP(userId, newOTP);

    return newOTP;
};

export const hasPendingOTP = async (userId: string) => {
    const pendingOTP = await prisma.oTP.findFirst({
        where: {
            userId,
            isUsed: false,
            expiresAt: {
                gt: new Date(),
            },
        },
    });

    return !!pendingOTP;
};

export const sendOTP = async (
    userId: string,
    method: "email" | "sms" = "email"
) => {
    const hasPending = await hasPendingOTP(userId);
    if (hasPending) {
        throw new Error(
            "OTP already sent. Please wait before requesting a new one."
        );
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true, first_name: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const otp = generateSecureOTP();
    await storeOTP(userId, otp);

    if (method === "email") {
        await sendOTPEmail(user.email, user.first_name, otp);
    }

    return {
        message: `OTP sent to your ${method}`,
        expiresIn: 10,
        otp: otp,
    };
};

const sendOTPEmail = async (email: string, name: string, otp: string) => {
    console.log(`Sending OTP ${otp} to email: ${email}`);

    // await emailService.sendMail({
    //     to: email,
    //     subject: "Your OTP Code",
    //     html: `
    //         <h2>Hello ${name},</h2>
    //         <p>Your OTP code is: <strong>${otp}</strong></p>
    //         <p>This code will expire in 10 minutes.</p>
    //     `
    // });
};

// const sendOTPSMS = async (phone: string, otp: string) => {
//     console.log(`Sending OTP ${otp} to phone: ${phone}`);

//     // await twilioClient.messages.create({
//     //     body: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
//     //     from: process.env.TWILIO_PHONE_NUMBER,
//     //     to: phone
//     // });
// };
