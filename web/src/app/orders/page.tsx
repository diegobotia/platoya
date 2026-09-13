"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Order, OrderStatus } from "@/lib/types";

const statusLabel: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  listo: "Listo",
  entregado: "Entregado",
};

function OrdersContent() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useSearchParams();
  const success = params.get("success");

  useEffect(() => {
    if (!token) return;
    api<{ orders: Order[] }>("/api/orders", { token })
      .then((data) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-20 md:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Mis pedidos</h1>
      <p className="mt-2 text-[var(--muted)]">Historial de reservas pagadas.</p>

      {success && (
        <p className="mt-6 rounded-xl border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          ¡Pedido confirmado! Tu reserva ya está en cocina.
        </p>
      )}

      {loading && <p className="mt-8 text-[var(--muted)]">Cargando…</p>}

      <ul className="mt-8 space-y-5">
        {orders.map((order) => (
          <li
            key={order.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/60 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[var(--muted)]">
                {new Date(order.createdAt).toLocaleString("es")}
              </p>
              <span className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs text-[var(--accent)]">
                {statusLabel[order.status]}
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {order.items.map((item, idx) => (
                <li key={`${order.id}-${idx}`}>
                  {item.quantity}× {item.name}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-[var(--muted)]">{order.deliveryAddress}</p>
            <p className="mt-2 font-semibold text-[var(--accent)]">
              ${order.total.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>

      {!loading && orders.length === 0 && (
        <p className="mt-8 text-[var(--muted)]">Aún no tienes pedidos.</p>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth role="cliente">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-[var(--muted)]">
            Cargando…
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </RequireAuth>
  );
}
