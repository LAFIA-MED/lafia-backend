import express from "express";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index";

import {
  createChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  getChatById,
  editMessage,
  deleteMessage,
} from "../services/chatService";
import { requireRoles } from "../middleware/requireRoles";
import { ROLE } from "@prisma/client";
import { prisma } from "../config/database";

const router = express.Router();

router.post(
  "/create",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { participantId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!participantId) {
        res.status(400).json({
          success: false,
          message: "Participant ID is required",
        });
        return;
      }

      if (userId === participantId) {
        res.status(400).json({
          success: false,
          message: "You cannot create a chat with yourself",
        });
        return;
      }

      const users = await prisma.user.findMany({
        where: {
          id: { in: [userId, participantId] },
        },
        select: { id: true, role: true },
      });

      if (users.length !== 2) {
        res.status(400).json({
          success: false,
          message: "Invalid participant ID",
        });
        return;
      }

      const currentUser = users.find((u) => u.id === userId);
      const participantUser = users.find((u) => u.id === participantId);

      if (!currentUser || !participantUser) {
        res.status(400).json({
          success: false,
          message: "User data not found",
        });
        return;
      }

      const currentUserRole = currentUser.role;
      const participantRole = participantUser.role;

      if (
        !(
          (currentUserRole === "DOCTOR" && participantRole === "PATIENT") ||
          (currentUserRole === "PATIENT" && participantRole === "DOCTOR")
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Chat can only be created between a doctor and a patient",
        });
        return;
      }

      const doctorId = currentUserRole === "DOCTOR" ? userId : participantId;
      const patientId = currentUserRole === "PATIENT" ? userId : participantId;

      const chat = await createChat(doctorId, patientId);

      res.json({
        success: true,
        data: chat,
        message:
          "participants" in chat && chat.participants
            ? "Existing chat retrieved"
            : "New chat created",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get all user chats
router.get(
  "/",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const chats = await getUserChats(userId);

      res.json({
        success: true,
        data: chats,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:chatId",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!chatId) {
        res.status(400).json({
          success: false,
          message: "Chat ID is required",
        });
        return;
      }

      const chat = await getChatById(chatId, userId);

      res.json({
        success: true,
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:chatId/messages",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;
      const { page = "1", limit = "50" } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!chatId) {
        res.status(400).json({
          success: false,
          message: "Chat ID is required",
        });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: "Invalid page number",
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: "Invalid limit (must be between 1 and 100)",
        });
        return;
      }

      const messages = await getChatMessages(chatId, userId, pageNum, limitNum);

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }
);

// This is for sending a message (but mainly handled via Socket.IO)
router.post(
  "/:chatId/messages",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;
      const { content, messageType = "TEXT", fileUrl } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!chatId) {
        res.status(400).json({
          success: false,
          message: "Chat ID is required",
        });
        return;
      }

      if (!content?.trim()) {
        res.status(400).json({
          success: false,
          message: "Message content is required",
        });
        return;
      }

      const message = await sendMessage(
        chatId,
        userId,
        content.trim(),
        messageType,
        fileUrl || null
      );

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:chatId/read",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!chatId) {
        res.status(400).json({
          success: false,
          message: "Chat ID is required",
        });
        return;
      }

      await markMessagesAsRead(chatId, userId);

      res.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/messages/:messageId",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;
      const { content } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!messageId) {
        res.status(400).json({
          success: false,
          message: "Message ID is required",
        });
        return;
      }

      if (!content?.trim()) {
        res.status(400).json({
          success: false,
          message: "Message content is required",
        });
        return;
      }

      const message = await editMessage(messageId, userId, content.trim());

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/messages/:messageId",
  requireRoles([ROLE.DOCTOR, ROLE.PATIENT]),
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!messageId) {
        res.status(400).json({
          success: false,
          message: "Message ID is required",
        });
        return;
      }

      const message = await deleteMessage(messageId, userId);

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as chatRoutes };
