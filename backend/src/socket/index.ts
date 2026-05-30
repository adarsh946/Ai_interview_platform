import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
console.log("socket 1 - socket.io imported");
import { frameHandler } from "./handlers/frameHandler.js";
console.log("socket 2 - frameHandler imported");
import { sessionHandler } from "./handlers/sessionHandler.js";
console.log("socket 3 - sessionHandler imported");

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    sessionHandler(io, socket);
    frameHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}
