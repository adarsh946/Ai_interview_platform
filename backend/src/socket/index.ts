import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    sessionHandler(io, socket);
    frameHandler(io, socket);

    socket.on("disconnet", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}
