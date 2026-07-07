import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
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
  });

  res.socket.server.io = io;
  (global as any).io = io;

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`Socket client connected: ${socket.id} (user: ${userId})`);

    // Join room for specific user messages
    if (userId) {
      socket.join(userId.toString());
    }

    socket.on("message", (data) => {
      // Broadcast to specific recipient room
      if (data.receiver_id) {
        io.to(data.receiver_id).emit("NEW_MESSAGE", {
          message: data
        });
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
          complaint_id: data.complaint_id
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
