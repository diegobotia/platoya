"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(user.role === "cocinero" ? "/cocinero" : "/menu");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 pt-24 pb-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Entrar</h1>
      <p className="mt-2 text-[var(--muted)]">Accede a tu cuenta PlatoYa</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-[var(--muted)]">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-[var(--muted)]">Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
        </label>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--accent)] py-3 font-semibold text-[var(--accent-fg)] disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-[var(--accent)]">
          Regístrate
        </Link>
      </p>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Demo: cliente@platoya.com / cocinero@platoya.com — password123
      </p>
    </div>
  );
}
