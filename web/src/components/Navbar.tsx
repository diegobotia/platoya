"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const linkClass = (href: string) => {
    const active =
      href === "/menu" ? pathname.startsWith("/menu") : pathname === href;
    return `text-sm tracking-wide transition ${
      active ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--fg)]"
    }`;
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="font-[family-name:var(--font-display)] text-2xl text-[var(--fg)]">
          PlatoYa
        </Link>

        <nav className="flex items-center gap-5 md:gap-7">
          <Link href="/menu" className={linkClass("/menu")}>
            Menú
          </Link>
          {user?.role === "cliente" && (
            <>
              <Link href="/cart" className={linkClass("/cart")}>
                Carrito{count > 0 ? ` (${count})` : ""}
              </Link>
              <Link href="/orders" className={linkClass("/orders")}>
                Pedidos
              </Link>
            </>
          )}
          {user?.role === "cocinero" && (
            <Link href="/cocinero" className={linkClass("/cocinero")}>
              Cocina
            </Link>
          )}
          {!user ? (
            <Link
              href="/login"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)]"
            >
              Entrar
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="text-sm text-[var(--muted)] hover:text-[var(--fg)]"
            >
              Salir
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
