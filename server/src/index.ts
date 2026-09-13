import http from "http";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { initSocket } from "./socket.js";

async function main() {
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(config.port, () => {
    console.log(`PlatoYa API + WebSocket en http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("No se pudo iniciar el servidor", err);
  process.exit(1);
});
