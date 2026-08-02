"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BrandLoader } from "@/components/SiteSeenMark";

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
    return <BrandLoader label="Loading SiteSeen..." />;
  }

  if (!user && !isPublic) {
    return <BrandLoader label="Redirecting..." />;
  }

  return <>{children}</>;
}
