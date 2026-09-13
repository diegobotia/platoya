import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import dishRoutes from "./routes/dishes.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "platoya-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/dishes", dishRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/payments", paymentRoutes);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  );

  return app;
}
