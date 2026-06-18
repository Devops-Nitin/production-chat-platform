import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const onlineUsers = new Map();

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("addUser", async (userId) => {
      try {
        if (!userId) return;

        onlineUsers.set(userId, socket.id);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
        });

        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      } catch (error) {
        console.error("addUser error:", error);
      }
    });

    socket.on("joinRoom", (room) => {
      if (!room) return;

      socket.join(room);
    });

    socket.on("joinGroup", ({ conversationId }) => {
      if (!conversationId) return;

      socket.join(conversationId);
    });

    socket.on("typing", ({ room, sender }) => {
      if (!room) return;

      socket.to(room).emit("typing", {
        room,
        sender,
      });
    });

    socket.on("stopTyping", ({ room, sender }) => {
      if (!room) return;

      socket.to(room).emit("stopTyping", {
        room,
        sender,
      });
    });

    socket.on("sendMessage", async (data) => {
      try {
        if (!data?._id && data?.sender && data?.room) {
          const savedMessage = await Message.create({
            sender: data.sender,
            receiver: data.receiver || "",
            conversationId: "",
            isGroupMessage: false,
            message: data.message || "",
            room: data.room,
            messageType: data.messageType || "text",
            fileUrl: data.fileUrl || "",
            fileName: data.fileName || "",
            fileMimeType: data.fileMimeType || "",
            status: "sent",
          });

          io.to(data.room).emit("receiveMessage", savedMessage);
          return;
        }

        io.to(data.room).emit("receiveMessage", data);
      } catch (error) {
        console.error("sendMessage error:", error);
      }
    });

    socket.on("sendGroupMessage", async (data) => {
      try {
        if (!data?._id && data?.sender && data?.conversationId) {
          const savedMessage = await Message.create({
            sender: data.sender,
            receiver: "",
            conversationId: data.conversationId,
            isGroupMessage: true,
            message: data.message || "",
            room: data.conversationId,
            messageType: data.messageType || "text",
            fileUrl: data.fileUrl || "",
            fileName: data.fileName || "",
            fileMimeType: data.fileMimeType || "",
            status: "sent",
          });

          await Conversation.findByIdAndUpdate(data.conversationId, {
            lastMessage: savedMessage._id.toString(),
          });

          io.to(data.conversationId).emit("receiveGroupMessage", savedMessage);
          return;
        }

        if (data?.conversationId) {
          await Conversation.findByIdAndUpdate(data.conversationId, {
            lastMessage: data._id?.toString() || "",
          });

          io.to(data.conversationId).emit("receiveGroupMessage", data);
        }
      } catch (error) {
        console.error("sendGroupMessage error:", error);
      }
    });

    socket.on("messageDelivered", async ({ messageId }) => {
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            status: "delivered",
            deliveredAt: new Date(),
          },
          { new: true }
        );

        if (updatedMessage?.room) {
          io.to(updatedMessage.room).emit("messageDelivered", updatedMessage);
        }
      } catch (error) {
        console.error("messageDelivered error:", error);
      }
    });

    socket.on("messageRead", async ({ messageId, userId }) => {
      try {
        if (!messageId || !userId) return;

        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            status: "read",
            readAt: new Date(),
            $addToSet: {
              readBy: {
                userId,
                readAt: new Date(),
              },
            },
          },
          { new: true }
        );

        if (updatedMessage?.room) {
          io.to(updatedMessage.room).emit("messageRead", updatedMessage);
        }
      } catch (error) {
        console.error("messageRead error:", error);
      }
    });

    socket.on("messageEdited", (updatedMessage) => {
      if (!updatedMessage?.room) return;

      io.to(updatedMessage.room).emit("messageEdited", updatedMessage);
    });

    socket.on("messageDeleted", (updatedMessage) => {
      if (!updatedMessage?.room) return;

      io.to(updatedMessage.room).emit("messageDeleted", updatedMessage);
    });

    socket.on("messageReactionUpdated", (updatedMessage) => {
      if (!updatedMessage?.room) return;

      io.to(updatedMessage.room).emit(
        "messageReactionUpdated",
        updatedMessage
      );
    });

    socket.on("disconnect", async () => {
      try {
        let disconnectedUserId = null;

        for (const [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            break;
          }
        }

        if (disconnectedUserId) {
          onlineUsers.delete(disconnectedUserId);

          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen: new Date(),
          });
        }

        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

        console.log("Socket disconnected:", socket.id);
      } catch (error) {
        console.error("disconnect error:", error);
      }
    });
  });
};

export default chatSocket;
