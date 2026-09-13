"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import type { Dish } from "@/lib/types";

export default function DishDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addDish } = useCart();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    api<{ dish: Dish }>(`/api/dishes/${params.id}`)
      .then((data) => setDish(data.dish))
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "No se pudo cargar el plato"
        );
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  function handleAdd() {
    if (!dish) return;
    addDish(dish);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-5 pt-28 text-[var(--muted)]">
        Cargando plato…
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-28 pb-20 md:px-8">
        <p className="text-[var(--danger)]">{error || "Plato no encontrado"}</p>
        <Link href="/menu" className="mt-4 inline-block text-[var(--accent)]">
          Volver al menú
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-28 pb-20 md:px-8">
      <button
        type="button"
        onClick={() => router.push("/menu")}
        className="relative z-10 mb-8 text-sm text-[var(--muted)] transition hover:text-[var(--fg)]"
      >
        ← Volver al menú
      </button>

      <div className="grid items-start gap-10 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-square">
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            unoptimized
          />
        </div>

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {dish.category}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl md:text-5xl">
            {dish.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-[var(--accent)]">
            ${dish.price.toFixed(2)}
          </p>
          <p className="mt-6 text-base leading-relaxed text-[var(--muted)] md:text-lg">
            {dish.description}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="relative z-10 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-fg)] transition hover:brightness-110"
            >
              {added ? "Añadido ✓" : "Añadir al carrito"}
            </button>
            <Link
              href="/cart"
              className="relative z-10 rounded-full border border-[var(--line)] px-6 py-3 text-sm transition hover:border-[var(--accent)]"
            >
              Ir al carrito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
