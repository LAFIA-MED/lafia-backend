import { MESSAGE_TYPE, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

interface User {
  id: string;
  role: string;
}

interface UserInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  role: string;
}

interface ChatParticipant {
  id: string;
  userId: string;
  unread_count: number;
  user: UserInfo;
}

interface Chat {
  id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  last_message_at: Date | null;
  participants: ChatParticipant[];
  messages?: Array<{
    id: string;
    content: string;
    created_at: Date;
    sender: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    };
  }>;
}

export const createChat = async (doctorId: string, patientId: string) => {
  const users = await prisma.user.findMany({
    where: {
      id: { in: [doctorId, patientId] },
    },
    select: { id: true, role: true },
  });

  if (users.length !== 2) {
    throw new Error("Both users must exist");
  }

  const roles = users.map((u) => u.role);
  if (!roles.includes("DOCTOR") || !roles.includes("PATIENT")) {
    throw new Error("Chat must be between a doctor and a patient");
  }

  const existingChat = await prisma.chat.findFirst({
    where: {
      AND: [
        {
          participants: {
            some: { userId: doctorId },
          },
        },
        {
          participants: {
            some: { userId: patientId },
          },
        },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              profile_picture: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (existingChat) {
    const doctor = existingChat.participants.find(
      (p) => p.user.role === "DOCTOR"
    )?.user;
    const patient = existingChat.participants.find(
      (p) => p.user.role === "PATIENT"
    )?.user;

    if (!doctor || !patient) {
      throw new Error("Invalid chat participants");
    }

    return {
      ...existingChat,
      doctor,
      patient,
    };
  }

  const chat = await prisma.chat.create({
    data: {
      participants: {
        create: [{ userId: doctorId }, { userId: patientId }],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              profile_picture: true,
              role: true,
            },
          },
        },
      },
    },
  });

  const doctor = chat.participants.find((p) => p.user.role === "DOCTOR")?.user;
  const patient = chat.participants.find(
    (p) => p.user.role === "PATIENT"
  )?.user;

  if (!doctor || !patient) {
    throw new Error("Invalid chat participants");
  }

  return {
    ...chat,
    doctor,
    patient,
  };
};

export const getUserChats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              profile_picture: true,
              role: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          created_at: "desc",
        },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      last_message_at: "desc",
    },
  });

  return chats.map((chat) => {
    const doctor = chat.participants.find(
      (p) => p.user.role === "DOCTOR"
    )?.user;
    const patient = chat.participants.find(
      (p) => p.user.role === "PATIENT"
    )?.user;
    const otherUser = chat.participants.find((p) => p.userId !== userId)?.user;
    const currentParticipant = chat.participants.find(
      (p) => p.userId === userId
    );

    if (!doctor || !patient || !otherUser) {
      throw new Error("Invalid chat participants");
    }

    return {
      id: chat.id,
      status: chat.status,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      last_message_at: chat.last_message_at,
      doctor,
      patient,
      otherUser,
      lastMessage: chat.messages?.[0] || null,
      unreadCount: currentParticipant?.unread_count || 0,
    };
  });
};

export const getChatMessages = async (
  chatId: string,
  userId: string,
  page = 1,
  limit = 50
) => {
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      chatId: chatId,
      userId: userId,
    },
  });

  if (!participant) {
    throw new Error("You are not a participant in this chat");
  }

  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: {
      chatId: chatId,
    },
    include: {
      sender: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
          role: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    skip: skip,
    take: limit,
  });

  return messages.reverse();
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  content: string,
  messageType = MESSAGE_TYPE.TEXT,
  fileUrl: string | null = null
) => {
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      chatId: chatId,
      userId: senderId,
    },
  });

  if (!participant) {
    throw new Error("You are not a participant in this chat");
  }

  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        chatId: chatId,
        senderId: senderId,
        content: content,
        message_type: messageType,
        file_url: fileUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
            role: true,
          },
        },
      },
    });

    await tx.chat.update({
      where: { id: chatId },
      data: { last_message_at: new Date() },
    });

    await tx.chatParticipant.updateMany({
      where: {
        chatId: chatId,
        userId: { not: senderId },
      },
      data: {
        unread_count: { increment: 1 },
      },
    });

    return message;
  });

  return result;
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      chatId: chatId,
      userId: userId,
    },
  });

  if (!participant) {
    throw new Error("You are not a participant in this chat");
  }

  return await prisma.chatParticipant.update({
    where: {
      id: participant.id,
    },
    data: {
      last_read_at: new Date(),
      unread_count: 0,
    },
  });
};

export const getChatById = async (chatId: string, userId: string) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      participants: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              profile_picture: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!chat) {
    throw new Error("Chat not found or you don't have access");
  }

  if (chat.participants.length !== 2) {
    throw new Error("Invalid chat format");
  }

  const doctor = chat.participants.find((p) => p.user.role === "DOCTOR");
  const patient = chat.participants.find((p) => p.user.role === "PATIENT");

  if (!doctor || !patient) {
    throw new Error("Chat must be between a doctor and a patient");
  }

  const otherUser = chat.participants.find((p) => p.userId !== userId)?.user;

  if (!otherUser) {
    throw new Error("Other user not found");
  }

  return {
    id: chat.id,
    status: chat.status,
    created_at: chat.created_at,
    updated_at: chat.updated_at,
    last_message_at: chat.last_message_at,
    doctor: doctor.user,
    patient: patient.user,
    otherUser,
  };
};

export const editMessage = async (
  messageId: string,
  userId: string,
  newContent: string
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, created_at: true },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.senderId !== userId) {
    throw new Error("You can only edit your own messages");
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (message.created_at < fiveMinutesAgo) {
    throw new Error("Cannot edit messages older than 5 minutes");
  }

  return await prisma.message.update({
    where: { id: messageId },
    data: {
      content: newContent,
      is_edited: true,
    },
    include: {
      sender: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
          role: true,
        },
      },
    },
  });
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, created_at: true },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.senderId !== userId) {
    throw new Error("You can only delete your own messages");
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (message.created_at < fiveMinutesAgo) {
    throw new Error("Cannot delete messages older than 5 minutes");
  }

  return await prisma.message.update({
    where: { id: messageId },
    data: {
      content: "This message was deleted",
      message_type: MESSAGE_TYPE.SYSTEM,
      file_url: null,
    },
    include: {
      sender: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
          role: true,
        },
      },
    },
  });
};
