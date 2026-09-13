import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { config } from "./config.js";
import { verifyToken } from "./middleware/auth.js";

let io: Server | null = null;

export function getIo() {
  return io;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);

      if (!token) {
        return next(new Error("No autenticado"));
      }

      const user = verifyToken(token);
      if (user.role !== "cocinero") {
        return next(new Error("Solo cocineros"));
      }

      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.join("cocinero");
    console.log(`Cocinero conectado: ${socket.data.user?.email}`);

    socket.on("disconnect", () => {
      console.log(`Cocinero desconectado: ${socket.data.user?.email}`);
    });
  });

  return io;
}
