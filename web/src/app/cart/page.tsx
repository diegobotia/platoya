"use client";

import Image from "next/image";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { useCart } from "@/lib/cart-context";

function CartContent() {
  const { items, address, setAddress, updateQuantity, removeItem, total } = useCart();

  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-20 md:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Carrito</h1>
      <p className="mt-2 text-[var(--muted)]">Revisa tu pedido e indica la dirección.</p>

      {items.length === 0 ? (
        <div className="mt-10">
          <p className="text-[var(--muted)]">Tu carrito está vacío.</p>
          <Link href="/menu" className="mt-4 inline-block text-[var(--accent)]">
            Ir al menú
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-5">
            {items.map((item) => (
              <li key={item.dishId} className="flex gap-4 border-b border-[var(--line)] pb-5">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between gap-3">
                    <h2 className="font-medium">{item.name}</h2>
                    <p className="text-[var(--accent)]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.dishId, Number(e.target.value) || 1)
                      }
                      className="w-16 rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.dishId)}
                      className="text-sm text-[var(--danger)]"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <label className="mt-8 block space-y-2">
            <span className="text-sm text-[var(--muted)]">Dirección de entrega</span>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, ciudad…"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-lg">
              Total:{" "}
              <span className="font-semibold text-[var(--accent)]">
                ${total.toFixed(2)}
              </span>
            </p>
            <Link
              href="/checkout"
              className={`rounded-full px-6 py-3 text-sm font-semibold ${
                address.trim().length < 5
                  ? "pointer-events-none bg-[var(--bg-elevated)] text-[var(--muted)]"
                  : "bg-[var(--accent)] text-[var(--accent-fg)]"
              }`}
            >
              Ir a pagar
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function CartPage() {
  return (
    <RequireAuth role="cliente">
      <CartContent />
    </RequireAuth>
  );
}
