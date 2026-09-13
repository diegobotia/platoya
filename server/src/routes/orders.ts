import { Router } from "express";
import { z } from "zod";
import {
  Order,
  ORDER_STATUSES,
  type OrderDocument,
  type OrderStatus,
} from "../models/Order.js";
import {
  authenticate,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import { getIo } from "../socket.js";

const router = Router();

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type SerializedOrder = {
  id: string;
  userId: string;
  items: OrderDocument["items"];
  status: OrderStatus;
  deliveryAddress: string;
  total: number;
  paypalOrderId?: string;
  paymentStatus?: string;
  createdAt: Date;
  updatedAt: Date;
};

function serializeOrder(order: OrderDocument): SerializedOrder {
  return {
    id: order._id.toString(),
    userId: order.userId.toString(),
    items: order.items,
    status: order.status as OrderStatus,
    deliveryAddress: order.deliveryAddress,
    total: order.total,
    paypalOrderId: order.paypalOrderId,
    paymentStatus: order.paymentStatus,
    createdAt: (order as OrderDocument & { createdAt: Date }).createdAt,
    updatedAt: (order as OrderDocument & { updatedAt: Date }).updatedAt,
  };
}

router.get("/", authenticate, async (req: AuthenticatedRequest, res) => {
  const filter =
    req.user!.role === "cocinero" ? {} : { userId: req.user!.id };

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return res.json({ orders: orders.map(serializeOrder) });
});

router.get("/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  const isOwner = order.userId.toString() === req.user!.id;
  if (!isOwner && req.user!.role !== "cocinero") {
    return res.status(403).json({ error: "No autorizado" });
  }

  return res.json({ order: serializeOrder(order) });
});

router.patch(
  "/:id",
  authenticate,
  requireRole("cocinero"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: parsed.data.status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const payload = serializeOrder(order);
    getIo()?.to("cocinero").emit("order:updated", payload);
    return res.json({ order: payload });
  }
);

export default router;
export { serializeOrder };
