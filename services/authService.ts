import { ILogin } from "../types";
import { generateToken } from "../utils/jwt";
import { comparePasswords } from "../utils/password";
import { findUserByEmail } from "./userService";

export const authenticateUser = async (loginData: ILogin) => {
    const user = await findUserByEmail(loginData.email);

    if (!user) {
        throw new Error("Invalid credentials");
    }
    if (!user.isVerified) {
        throw new Error("Email verification required");
    }
    if (!user.password) {
        throw new Error("Profile setup incomplete");
    }

    const isPasswordValid = await comparePasswords(
        loginData.password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    };
};