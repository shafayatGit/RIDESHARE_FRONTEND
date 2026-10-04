import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";

let socket: Socket | null = null;

export function getSocket(accessToken: string): Socket {
  if (socket && socket.connected) return socket;

  socket = io(API_BASE_URL, {
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
