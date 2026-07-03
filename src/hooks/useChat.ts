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

    // Standard Next.js Socket.IO bootstrap sequence
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
        reconnection: false, // Handle reconnection manually with backoff
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

      socket.on("NEW_MESSAGE", (data: any) => {
        log("NEW_MESSAGE event received:", data);
        if (onMessageReceived && data.message) {
          onMessageReceived(data.message);
        }
      });

      socket.on("TYPING", (data: any) => {
        log("TYPING event received:", data);
        if (onTypingReceived) {
          onTypingReceived(data);
        }
      });

      socket.on("SEEN", (data: any) => {
        log("SEEN event received:", data);
        if (onSeenReceived) {
          onSeenReceived(data);
        }
      });

      socket.on("connect_error", (err) => {
        logError("Connect error:", err);
        socket.close();
      });

      socket.on("disconnect", () => {
        log("Socket.IO connection disconnected.");
        setStatus("Disconnected");

        // Calculate backoff time: min(1000 * 2^reconnectCount, 30000)
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
        log(`Scheduling reconnect attempt in ${delay}ms...`);
        reconnectCountRef.current += 1;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
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
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        socketRef.current.off("connect");
        socketRef.current.off("NEW_MESSAGE");
        socketRef.current.off("TYPING");
        socketRef.current.off("SEEN");
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

  const sendTyping = useCallback(
    (receiverId: string, isTyping: boolean, complaintId?: string) => {
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
        type: "SEEN",
        receiver_id: receiverId,
        complaint_id: complaintId,
      });
    },
    [sendEvent]
  );

  return {
    isConnected: status === "Connected",
    connectionStatus: status,
    sendTyping,
    sendSeen,
  };
}
