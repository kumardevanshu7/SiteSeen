"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/"];

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname || "/");

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace("/");
    }
  }, [user, loading, isPublic, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
