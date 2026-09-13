import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import {
  authenticate,
  signToken,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }

  const { name, email, password } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "El correo ya está registrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "cliente",
  });

  const payload = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = signToken(payload);

  return res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const payload = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = signToken(payload);

  return res.json({ token, user: publicUser(user) });
});

router.get("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user!.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  return res.json({ user: publicUser(user) });
});

export default router;
