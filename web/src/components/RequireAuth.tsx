"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole | UserRole[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const roles = useMemo(() => {
    if (!role) return null;
    return Array.isArray(role) ? role : [role];
  }, [role]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(user.role === "cocinero" ? "/cocinero" : "/menu");
    }
  }, [user, loading, router, roles]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--muted)]">
        Cargando…
      </div>
    );
  }

  return <>{children}</>;
}
