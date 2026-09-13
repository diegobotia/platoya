"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import type { Dish } from "@/lib/types";

export default function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("Todos");
  const { addDish } = useCart();

  useEffect(() => {
    api<{ dishes: Dish[] }>("/api/dishes")
      .then((data) => setDishes(data.dishes))
      .catch(() => setError("No se pudo cargar el menú"))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(dishes.map((d) => d.category));
    return ["Todos", ...Array.from(set)];
  }, [dishes]);

  const filtered =
    category === "Todos" ? dishes : dishes.filter((d) => d.category === category);

  return (
    <div className="relative z-0 mx-auto max-w-6xl px-5 pt-28 pb-20 md:px-8">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
          Menú
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Elige tus platos favoritos y añádelos al carrito.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`relative z-10 rounded-full px-4 py-2 text-sm transition ${
              category === c
                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="text-[var(--muted)]">Cargando platos…</p>}
      {error && <p className="text-[var(--danger)]">{error}</p>}

      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((dish) => (
          <article
            key={dish._id}
            className="group relative z-10 flex flex-col"
            style={{ pointerEvents: "auto" }}
          >
            <Link
              href={`/menu/${dish._id}`}
              className="relative mb-4 block aspect-[4/3] overflow-hidden rounded-2xl"
              aria-label={`Ver detalles de ${dish.name}`}
            >
              <Image
                src={dish.imageUrl}
                alt={dish.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
            </Link>

            <div className="flex flex-1 items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {dish.category}
                </p>
                <Link href={`/menu/${dish._id}`} className="mt-1 block">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl transition hover:text-[var(--accent)]">
                    {dish.name}
                  </h2>
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                  {dish.description}
                </p>
              </div>
              <Link
                href={`/menu/${dish._id}`}
                className="shrink-0 text-lg font-semibold text-[var(--accent)] hover:underline"
              >
                ${dish.price.toFixed(2)}
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/menu/${dish._id}`}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Ver detalles
              </Link>
              <button
                type="button"
                onClick={() => addDish(dish)}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] transition hover:brightness-110"
              >
                Añadir
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
