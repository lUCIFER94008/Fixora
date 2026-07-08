import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as SocketIOServer } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const socketHandler = (req: NextApiRequest, res: any) => {
  if (res.socket.server.io) {
    console.log("Socket.IO server already initialized");
    res.end();
    return;
  }

  console.log("Initializing Socket.IO server...");
  const httpServer: NetServer = res.socket.server;
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  res.socket.server.io = io;
  (global as any).io = io;

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`Socket client connected: ${socket.id} (user: ${userId})`);

    // Standard Room logic
    if (userId) {
      socket.join(userId.toString());
    }

    // ── 1. JOIN ROOM & LEAVE ROOM (per Complaint Room) ──
    socket.on("join-room", (data) => {
      const roomId = data.roomId || data.complaintId;
      if (roomId) {
        socket.join(roomId);
        console.log(`Socket ${socket.id} (user: ${userId}) joined room: ${roomId}`);
      }
    });

    socket.on("joinRoom", (roomId) => {
      if (roomId) {
        socket.join(roomId.toString());
        console.log(`Socket ${socket.id} (user: ${userId}) joinedRoom: ${roomId}`);
      }
    });

    socket.on("leave-room", (data) => {
      const roomId = data.roomId || data.complaintId;
      if (roomId) {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} (user: ${userId}) left room: ${roomId}`);
      }
    });

    socket.on("leaveRoom", (roomId) => {
      if (roomId) {
        socket.leave(roomId.toString());
        console.log(`Socket ${socket.id} (user: ${userId}) leftRoom: ${roomId}`);
      }
    });

    // ── 2. SEND MESSAGE ──
    socket.on("send-message", (data) => {
      // Broadcast to room
      const roomId = data.roomId || data.complaintId;
      if (roomId) {
        io.to(roomId).emit("receive-message", data);
        io.to(roomId).emit("NEW_MESSAGE", { message: data });
        io.to(roomId).emit("newMessage", data);
      }
      // Direct user fallbacks
      if (data.receiverId || data.receiver_id) {
        const receiver = (data.receiverId || data.receiver_id).toString();
        io.to(receiver).emit("NEW_MESSAGE", { message: data });
        io.to(receiver).emit("receive-message", data);
        io.to(receiver).emit("newMessage", data);
      }
    });

    socket.on("sendMessage", (data) => {
      const roomId = data.roomId || data.complaintId;
      if (roomId) {
        io.to(roomId.toString()).emit("newMessage", data);
        io.to(roomId.toString()).emit("receive-message", data);
        io.to(roomId.toString()).emit("NEW_MESSAGE", { message: data });
      }
      if (data.receiverId || data.receiver_id) {
        const receiver = (data.receiverId || data.receiver_id).toString();
        io.to(receiver).emit("newMessage", data);
        io.to(receiver).emit("receive-message", data);
        io.to(receiver).emit("NEW_MESSAGE", { message: data });
      }
    });

    // ── 3. TYPING & STOP-TYPING ──
    socket.on("typing", (data) => {
      const roomId = data.roomId || data.complaintId;
      const target = roomId || data.receiverId || data.receiver_id;
      if (target) {
        socket.to(target.toString()).emit("typing", {
          senderId: userId,
          complaintId: data.complaintId || roomId,
          isTyping: true
        });
        socket.to(target.toString()).emit("TYPING", {
          sender_id: userId,
          senderId: userId,
          is_typing: true,
          complaint_id: data.complaintId || roomId,
          complaintId: data.complaintId || roomId
        });
      }
    });

    socket.on("stop-typing", (data) => {
      const roomId = data.roomId || data.complaintId;
      const target = roomId || data.receiverId || data.receiver_id;
      if (target) {
        socket.to(target.toString()).emit("stop-typing", {
          senderId: userId,
          complaintId: data.complaintId || roomId,
          isTyping: false
        });
        socket.to(target.toString()).emit("TYPING", {
          sender_id: userId,
          senderId: userId,
          is_typing: false,
          complaint_id: data.complaintId || roomId,
          complaintId: data.complaintId || roomId
        });
      }
    });

    // ── 4. MESSAGE READ / SEEN ──
    socket.on("message-read", (data) => {
      const roomId = data.roomId || data.complaintId;
      const target = roomId || data.receiverId || data.receiver_id;
      if (target) {
        socket.to(target.toString()).emit("message-read", data);
        socket.to(target.toString()).emit("SEEN", {
          sender_id: userId,
          complaint_id: data.complaintId || roomId,
          complaintId: data.complaintId || roomId
        });
      }
    });

    // Backward compatible handlers
    socket.on("message", (data) => {
      if (data.receiver_id) {
        io.to(data.receiver_id).emit("NEW_MESSAGE", { message: data });
        io.to(data.receiver_id).emit("newMessage", data);
      }
      const roomId = data.complaintId || data.complaint_id;
      if (roomId) {
        io.to(roomId).emit("NEW_MESSAGE", { message: data });
        io.to(roomId).emit("newMessage", data);
      }
    });

    socket.on("TYPING", (data) => {
      if (data.receiver_id) {
        io.to(data.receiver_id).emit("TYPING", {
          sender_id: userId,
          senderId: userId,
          is_typing: data.is_typing,
          complaint_id: data.complaint_id,
          complaintId: data.complaint_id
        });
      }
    });

    socket.on("SEEN", (data) => {
      if (data.receiver_id) {
        io.to(data.receiver_id).emit("SEEN", {
          sender_id: userId,
          complaint_id: data.complaint_id,
          complaintId: data.complaint_id
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  res.end();
};

export default socketHandler;
