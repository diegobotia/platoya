import Link from "next/link";

export default function HomePage() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1800&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(18,14,10,0.92)] via-[rgba(18,14,10,0.72)] to-[rgba(18,14,10,0.35)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24">
        <p className="mb-3 font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight text-[var(--fg)] md:text-7xl lg:text-8xl">
          PlatoYa
        </p>
        <h1 className="max-w-xl text-xl font-medium text-[var(--fg)] md:text-2xl">
          Platos recién hechos, del menú a tu puerta.
        </h1>
        <p className="mt-4 max-w-md text-[var(--muted)]">
          Explora el menú, paga con PayPal y deja que la cocina prepare tu pedido
          en tiempo real.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-fg)] transition hover:brightness-110"
          >
            Ver menú
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--line)] px-6 py-3 text-sm text-[var(--fg)] transition hover:border-[var(--accent)]"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  );
}
