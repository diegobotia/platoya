import { Router } from "express";
import { z } from "zod";
import { Dish } from "../models/Dish.js";
import {
  authenticate,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

const router = Router();

const dishSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  imageUrl: z.string().url(),
  category: z.string().min(2),
  available: z.boolean().optional(),
});

router.get("/", async (_req, res) => {
  const dishes = await Dish.find({ available: true }).sort({ category: 1, name: 1 });
  return res.json({ dishes });
});

router.get("/all", authenticate, requireRole("cocinero"), async (_req, res) => {
  const dishes = await Dish.find().sort({ category: 1, name: 1 });
  return res.json({ dishes });
});

router.get("/:id", async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish || !dish.available) {
    return res.status(404).json({ error: "Plato no encontrado" });
  }
  return res.json({ dish });
});

router.post(
  "/",
  authenticate,
  requireRole("cocinero"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = dishSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    }
    const dish = await Dish.create(parsed.data);
    return res.status(201).json({ dish });
  }
);

router.patch(
  "/:id",
  authenticate,
  requireRole("cocinero"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = dishSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos" });
    }
    const dish = await Dish.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
    });
    if (!dish) {
      return res.status(404).json({ error: "Plato no encontrado" });
    }
    return res.json({ dish });
  }
);

router.delete(
  "/:id",
  authenticate,
  requireRole("cocinero"),
  async (req: AuthenticatedRequest, res) => {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) {
      return res.status(404).json({ error: "Plato no encontrado" });
    }
    return res.json({ ok: true });
  }
);

export default router;
