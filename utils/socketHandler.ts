import { Server, Socket } from "socket.io";
import { verify } from "jsonwebtoken";
import { config } from "../config/env";
import {
  sendMessage,
  markMessagesAsRead,
  getChatById,
} from "../services/chatService";
import { MESSAGE_TYPE } from "@prisma/client";

interface AuthenticatedSocket extends Socket {
  user?: { id: string; role: string };
}

const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication token required"));
  }

  try {
    const decoded = verify(token, config.jwtSecret) as {
      id: string;
      role: string;
    };
    (socket as AuthenticatedSocket).user = decoded;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
};

export const setupSocket = (io: Server) => {
  io.use(authenticateSocket);

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.id}`);

    socket.on("joinChat", async (chatId: string) => {
      try {
        if (!socket.user) {
          socket.emit("error", { message: "User not authenticated" });
          return;
        }

        await getChatById(chatId, socket.user.id);
        socket.join(chatId);
        console.log(`User ${socket.user.id} joined chat ${chatId}`);

        await markMessagesAsRead(chatId, socket.user.id);
        io.to(chatId).emit("messagesRead", { chatId, userId: socket.user.id });
      } catch (error: any) {
        socket.emit("error", {
          message: error.message || "Failed to join chat",
        });
      }
    });

    socket.on(
      "sendMessage",
      async ({
        chatId,
        content,
        messageType = MESSAGE_TYPE.TEXT,
        fileUrl,
      }: {
        chatId: string;
        content: string;
        messageType?: MESSAGE_TYPE;
        fileUrl?: string;
      }) => {
        try {
          if (!socket.user) {
            socket.emit("error", { message: "User not authenticated" });
            return;
          }

          const message = await sendMessage(
            chatId,
            socket.user.id,
            content,
            (messageType = MESSAGE_TYPE.TEXT),
            fileUrl || null
          );

          io.to(chatId).emit("newMessage", message);
        } catch (error: any) {
          socket.emit("error", {
            message: error.message || "Failed to send message",
          });
        }
      }
    );

    socket.on("markMessagesRead", async (chatId: string) => {
      try {
        if (!socket.user) {
          socket.emit("error", { message: "User not authenticated" });
          return;
        }

        await markMessagesAsRead(chatId, socket.user.id);
        io.to(chatId).emit("messagesRead", { chatId, userId: socket.user.id });
      } catch (error: any) {
        socket.emit("error", {
          message: error.message || "Failed to mark messages as read",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user?.id}`);
    });
  });
};
