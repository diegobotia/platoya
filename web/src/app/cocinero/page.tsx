"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { io, type Socket } from "socket.io-client";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Order, OrderStatus } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

const COLUMNS: { id: OrderStatus; title: string }[] = [
  { id: "pendiente", title: "Pendiente" },
  { id: "en_preparacion", title: "En preparación" },
  { id: "listo", title: "Listo" },
  { id: "entregado", title: "Entregado" },
];

function OrderCard({ order, dragging }: { order: Order; dragging?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 shadow-sm ${
        dragging ? "opacity-90 ring-2 ring-[var(--accent)]" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">
          #{order.id.slice(-6).toUpperCase()}
        </p>
        <p className="text-sm font-semibold text-[var(--accent)]">
          ${order.total.toFixed(2)}
        </p>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {order.items.map((item, idx) => (
          <li key={`${order.id}-${idx}`}>
            {item.quantity}× {item.name}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
        {order.deliveryAddress}
      </p>
    </div>
  );
}

function SortableOrder({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: order.id, data: { status: order.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCard order={order} />
    </div>
  );
}

function Column({
  id,
  title,
  orders,
}: {
  id: OrderStatus;
  title: string;
  orders: Order[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] flex-col rounded-2xl bg-[var(--column)] p-3 ${
        isOver ? "outline outline-2 outline-[var(--accent)]" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
        <span className="text-xs text-[var(--muted)]">{orders.length}</span>
      </div>
      <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3">
          {orders.map((order) => (
            <SortableOrder key={order.id} order={order} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    if (!token) return;
    api<{ orders: Order[] }>("/api/orders", { token }).then((data) =>
      setOrders(data.orders)
    );
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("order:created", (order: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    socket.on("order:updated", (order: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const byStatus = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      pendiente: [],
      en_preparacion: [],
      listo: [],
      entregado: [],
    };
    for (const order of orders) {
      map[order.status]?.push(order);
    }
    return map;
  }, [orders]);

  const activeOrder = orders.find((o) => o.id === activeId) || null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !token) return;

    const orderId = String(active.id);
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    let nextStatus: OrderStatus | null = null;
    const overId = String(over.id);

    if (COLUMNS.some((c) => c.id === overId)) {
      nextStatus = overId as OrderStatus;
    } else {
      const overOrder = orders.find((o) => o.id === overId);
      if (overOrder) nextStatus = overOrder.status;
    }

    if (!nextStatus || nextStatus === order.status) return;

    const previous = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus! } : o))
    );

    try {
      const data = await api<{ order: Order }>(`/api/orders/${orderId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: nextStatus }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch {
      setOrders(previous);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-28 pb-16 md:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl">Cocina</h1>
          <p className="mt-2 text-[var(--muted)]">
            Arrastra los pedidos entre columnas. Actualización en tiempo real.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            connected
              ? "bg-[var(--success)]/15 text-[var(--success)]"
              : "bg-[var(--danger)]/15 text-[var(--danger)]"
          }`}
        >
          {connected ? "En vivo" : "Reconectando…"}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              orders={byStatus[col.id]}
            />
          ))}
        </div>
        <DragOverlay>
          {activeOrder ? <OrderCard order={activeOrder} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default function CocineroPage() {
  return (
    <RequireAuth role="cocinero">
      <KanbanBoard />
    </RequireAuth>
  );
}
