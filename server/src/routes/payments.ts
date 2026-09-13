import { Router } from "express";
import { z } from "zod";
import { Dish } from "../models/Dish.js";
import { Order } from "../models/Order.js";
import {
  authenticate,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  capturePayPalOrder,
  createPayPalOrder,
  isPayPalConfigured,
} from "../services/paypal.js";
import { getIo } from "../socket.js";
import { serializeOrder } from "./orders.js";

const router = Router();

const itemSchema = z.object({
  dishId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const createSchema = z.object({
  items: z.array(itemSchema).min(1),
  deliveryAddress: z.string().min(5),
});

const captureSchema = createSchema.extend({
  paypalOrderId: z.string().min(1),
});

async function resolveCart(items: z.infer<typeof itemSchema>[]) {
  const dishIds = items.map((i) => i.dishId);
  const dishes = await Dish.find({ _id: { $in: dishIds }, available: true });
  const byId = new Map(dishes.map((d) => [d._id.toString(), d]));

  const orderItems = [];
  let total = 0;

  for (const item of items) {
    const dish = byId.get(item.dishId);
    if (!dish) {
      throw new Error(`Plato no disponible: ${item.dishId}`);
    }
    orderItems.push({
      dishId: dish._id,
      name: dish.name,
      price: dish.price,
      quantity: item.quantity,
    });
    total += dish.price * item.quantity;
  }

  return { orderItems, total };
}

router.post(
  "/paypal/create",
  authenticate,
  requireRole("cliente"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    try {
      const { total } = await resolveCart(parsed.data.items);

      if (!isPayPalConfigured()) {
        return res.json({
          demo: true,
          id: `DEMO-${Date.now()}`,
          total,
        });
      }

      const paypalOrder = await createPayPalOrder(total);
      return res.json({ id: paypalOrder.id, status: paypalOrder.status, total });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error creando pago";
      return res.status(400).json({ error: message });
    }
  }
);

router.post(
  "/paypal/capture",
  authenticate,
  requireRole("cliente"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = captureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    try {
      const { orderItems, total } = await resolveCart(parsed.data.items);
      const { paypalOrderId, deliveryAddress } = parsed.data;

      if (isPayPalConfigured() && !paypalOrderId.startsWith("DEMO-")) {
        const capture = await capturePayPalOrder(paypalOrderId);
        if (capture.status !== "COMPLETED") {
          return res.status(400).json({ error: "Pago no completado" });
        }
      }

      const order = await Order.create({
        userId: req.user!.id,
        items: orderItems,
        status: "pendiente",
        deliveryAddress,
        total,
        paypalOrderId,
        paymentStatus: "paid",
      });

      const payload = serializeOrder(order);
      getIo()?.to("cocinero").emit("order:created", payload);

      return res.status(201).json({ order: payload });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error capturando pago";
      return res.status(400).json({ error: message });
    }
  }
);

export default router;
