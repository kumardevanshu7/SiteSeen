"use client";

import { useEffect, useState } from "react";

/** Mobile enter/exit slide shell for site detail */
export default function SiteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const onExit = () => setExiting(true);
    window.addEventListener("siteseen-page-exit", onExit);
    return () => window.removeEventListener("siteseen-page-exit", onExit);
  }, []);

  useEffect(() => {
    setExiting(false);
  }, [children]);

  return (
    <div
      className={`${exiting ? "page-slide-out" : "page-slide-in"} bg-surface-soft`}
    >
      {children}
    </div>
  );
}
