"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { RequireAuth } from "@/components/RequireAuth";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import type { Order } from "@/lib/types";

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

function CheckoutContent() {
  const { items, address, total, clear } = useCart();
  const { token } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [payingDemo, setPayingDemo] = useState(false);

  const payload = useMemo(
    () => ({
      items: items.map((i) => ({ dishId: i.dishId, quantity: i.quantity })),
      deliveryAddress: address,
    }),
    [items, address]
  );

  async function capture(paypalOrderId: string) {
    const data = await api<{ order: Order }>("/api/payments/paypal/capture", {
      method: "POST",
      token,
      body: JSON.stringify({ ...payload, paypalOrderId }),
    });
    clear();
    router.push(`/orders?success=${data.order.id}`);
  }

  async function payDemo() {
    setPayingDemo(true);
    setError("");
    try {
      const created = await api<{ id: string; demo?: boolean }>(
        "/api/payments/paypal/create",
        {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        }
      );
      await capture(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar el pago");
      setPayingDemo(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-28 pb-20">
        <p className="text-[var(--muted)]">No hay ítems para pagar.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-28 pb-20 md:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Checkout</h1>
      <p className="mt-2 text-[var(--muted)]">Confirma el resumen y paga con PayPal.</p>

      <div className="mt-8 space-y-3 border-y border-[var(--line)] py-6">
        {items.map((item) => (
          <div key={item.dishId} className="flex justify-between text-sm">
            <span>
              {item.quantity}× {item.name}
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 text-lg font-semibold">
          <span>Total</span>
          <span className="text-[var(--accent)]">${total.toFixed(2)}</span>
        </div>
      </div>

      <p className="mt-6 text-sm text-[var(--muted)]">
        Entrega en: <span className="text-[var(--fg)]">{address}</span>
      </p>

      <div className="mt-8 space-y-4">
        {paypalClientId ? (
          <PayPalScriptProvider
            options={{
              clientId: paypalClientId,
              currency: "USD",
              intent: "capture",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", color: "gold" }}
              createOrder={async () => {
                setError("");
                const data = await api<{ id: string }>(
                  "/api/payments/paypal/create",
                  {
                    method: "POST",
                    token,
                    body: JSON.stringify(payload),
                  }
                );
                return data.id;
              }}
              onApprove={async (data: { orderID: string }) => {
                try {
                  await capture(data.orderID);
                } catch (err) {
                  setError(
                    err instanceof ApiError
                      ? err.message
                      : "Error al confirmar el pago"
                  );
                }
              }}
              onError={() => setError("PayPal reportó un error")}
            />
          </PayPalScriptProvider>
        ) : (
          <button
            type="button"
            disabled={payingDemo}
            onClick={payDemo}
            className="w-full rounded-full bg-[var(--accent)] py-3 font-semibold text-[var(--accent-fg)] disabled:opacity-60"
          >
            {payingDemo ? "Procesando…" : "Pagar (modo demo sin PayPal)"}
          </button>
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth role="cliente">
      <CheckoutContent />
    </RequireAuth>
  );
}
