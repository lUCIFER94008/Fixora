import { useEffect, useRef, useState, useCallback } from "react";
import { io as ClientIO, Socket } from "socket.io-client";

export type ConnectionStatus = "Connecting" | "Connected" | "Reconnecting" | "Disconnected";

interface UseChatProps {
  userId?: string;
  onMessageReceived?: (message: any) => void;
  onStatusUpdate?: (statusUpdate: any) => void;
  onTypingReceived?: (typingUpdate: any) => void;
  onSeenReceived?: (seenUpdate: any) => void;
}

export function useChat({
  userId,
  onMessageReceived,
  onStatusUpdate,
  onTypingReceived,
  onSeenReceived,
}: UseChatProps) {
  const [status, setStatus] = useState<ConnectionStatus>("Disconnected");
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const messageQueueRef = useRef<object[]>([]);

  // Keep references to prevent stale closures
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const onTypingReceivedRef = useRef(onTypingReceived);
  const onSeenReceivedRef = useRef(onSeenReceived);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onStatusUpdateRef.current = onStatusUpdate;
    onTypingReceivedRef.current = onTypingReceived;
    onSeenReceivedRef.current = onSeenReceived;
  });

  const isDev = process.env.NODE_ENV === "development";

  const log = useCallback((...args: any[]) => {
    if (isDev) {
      console.log("[SOCKET-IO-CHAT]", ...args);
    }
  }, [isDev]);

  const logError = useCallback((...args: any[]) => {
    if (isDev) {
      console.error("[SOCKET-IO-CHAT-ERROR]", ...args);
    }
  }, [isDev]);

  const connect = useCallback(async () => {
    if (!userId) {
      setStatus("Disconnected");
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    try {
      log("Bootstrapping Next.js Socket.IO server at /api/socket...");
      await fetch("/api/socket").catch(() => null);
    } catch (e) {
      // Ignore initial request error
    }

    setStatus(reconnectCountRef.current > 0 ? "Reconnecting" : "Connecting");

    try {
      const socket = ClientIO(window.location.origin, {
        path: "/api/socket",
        query: { userId },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 5000
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        log("Socket.IO client connected successfully:", socket.id);
        setStatus("Connected");
        reconnectCountRef.current = 0;

        // Process message queue
        while (messageQueueRef.current.length > 0) {
          const event: any = messageQueueRef.current.shift();
          if (event) {
            log("Sending queued event frame:", event);
            socket.emit(event.type || "message", event);
          }
        }
      });

      // ── Message Listeners ──
      socket.on("newMessage", (data: any) => {
        log("newMessage event received:", data);
        if (onMessageReceivedRef.current) {
          onMessageReceivedRef.current(data.message || data);
        }
      });

      socket.on("NEW_MESSAGE", (data: any) => {
        log("NEW_MESSAGE event received:", data);
        if (onMessageReceivedRef.current && data.message) {
          onMessageReceivedRef.current(data.message);
        }
      });

      socket.on("receive-message", (data: any) => {
        log("receive-message event received:", data);
        if (onMessageReceivedRef.current) {
          onMessageReceivedRef.current(data);
        }
      });

      // ── Typing Listeners ──
      socket.on("TYPING", (data: any) => {
        log("TYPING event received:", data);
        if (onTypingReceivedRef.current) {
          onTypingReceivedRef.current(data);
        }
      });

      socket.on("typing", (data: any) => {
        log("typing event received:", data);
        if (onTypingReceivedRef.current) {
          onTypingReceivedRef.current({
            senderId: data.senderId,
            is_typing: data.isTyping,
            complaintId: data.complaintId
          });
        }
      });

      socket.on("stop-typing", (data: any) => {
        log("stop-typing event received:", data);
        if (onTypingReceivedRef.current) {
          onTypingReceivedRef.current({
            senderId: data.senderId,
            is_typing: false,
            complaintId: data.complaintId
          });
        }
      });

      // ── Seen/Read Listeners ──
      socket.on("SEEN", (data: any) => {
        log("SEEN event received:", data);
        if (onSeenReceivedRef.current) {
          onSeenReceivedRef.current(data);
        }
      });

      socket.on("message-read", (data: any) => {
        log("message-read event received:", data);
        if (onSeenReceivedRef.current) {
          onSeenReceivedRef.current(data);
        }
      });

      socket.on("connect_error", (err) => {
        logError("Connect error:", err);
      });

      socket.on("disconnect", (reason) => {
        log("Socket.IO connection disconnected. Reason:", reason);
        setStatus("Disconnected");

        if (reason === "io server disconnect") {
          // the server has forcefully disconnected the socket, need to reconnect manually
          connect();
        }
      });

    } catch (err) {
      logError("Socket.IO client initialization exception:", err);
      setStatus("Disconnected");
    }
  }, [userId, onMessageReceived, onStatusUpdate, onTypingReceived, onSeenReceived, log, logError]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("NEW_MESSAGE");
        socketRef.current.off("receive-message");
        socketRef.current.off("TYPING");
        socketRef.current.off("typing");
        socketRef.current.off("stop-typing");
        socketRef.current.off("SEEN");
        socketRef.current.off("message-read");
        socketRef.current.off("connect_error");
        socketRef.current.off("disconnect");
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendEvent = useCallback((event: any) => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(event.type || "message", event);
      } else {
        log("Socket.IO client offline. Queueing event:", event);
        messageQueueRef.current.push(event);
      }
    } catch (e) {
      logError("Failed to emit event frame:", e);
      messageQueueRef.current.push(event);
    }
  }, [log, logError]);

  const joinRoom = useCallback(
    (roomId: string) => {
      sendEvent({
        type: "join-room",
        roomId,
      });
      // Emit direct camelCase event
      try {
        if (socketRef.current?.connected) {
          socketRef.current.emit("joinRoom", roomId);
        }
      } catch (e) {
        logError("Failed to emit joinRoom", e);
      }
    },
    [sendEvent, logError]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      sendEvent({
        type: "leave-room",
        roomId,
      });
      // Emit direct camelCase event
      try {
        if (socketRef.current?.connected) {
          socketRef.current.emit("leaveRoom", roomId);
        }
      } catch (e) {
        logError("Failed to emit leaveRoom", e);
      }
    },
    [sendEvent, logError]
  );

  const sendTyping = useCallback(
    (receiverId: string, isTyping: boolean, complaintId?: string) => {
      sendEvent({
        type: isTyping ? "typing" : "stop-typing",
        receiverId,
        complaintId,
        isTyping,
      });
      // Fallback old structure compatibility
      sendEvent({
        type: "TYPING",
        receiver_id: receiverId,
        is_typing: isTyping,
        complaint_id: complaintId,
      });
    },
    [sendEvent]
  );

  const sendSeen = useCallback(
    (receiverId: string, complaintId?: string) => {
      sendEvent({
        type: "message-read",
        receiverId,
        complaintId,
      });
      sendEvent({
        type: "SEEN",
        receiver_id: receiverId,
        complaint_id: complaintId,
      });
    },
    [sendEvent]
  );

  const sendMessage = useCallback(
    (messageData: { roomId: string; message: string; senderId: string; receiverId: string; timestamp?: string }) => {
      sendEvent({
        type: "send-message",
        ...messageData,
        complaintId: messageData.roomId
      });
      // Direct camelCase sendMessage
      try {
        if (socketRef.current?.connected) {
          socketRef.current.emit("sendMessage", messageData);
        }
      } catch (e) {
        logError("Failed to emit sendMessage", e);
      }
    },
    [sendEvent, logError]
  );

  return {
    isConnected: status === "Connected",
    connectionStatus: status,
    joinRoom,
    leaveRoom,
    sendTyping,
    sendSeen,
    sendMessage,
  };
}
