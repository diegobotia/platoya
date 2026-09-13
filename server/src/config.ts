import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/platoya",
  jwtSecret: process.env.JWT_SECRET || "platoya-dev-secret-change-me",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    apiBase:
      process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com",
  },
};
