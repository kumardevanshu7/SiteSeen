"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "rgb(var(--canvas))",
          "--normal-text": "rgb(var(--ink))",
          "--normal-border": "rgb(var(--hairline))",
          "--success-bg": "rgb(var(--canvas))",
          "--success-text": "rgb(var(--ink))",
          "--success-border": "rgb(var(--hairline))",
          "--error-bg": "rgb(var(--canvas))",
          "--error-text": "rgb(var(--ink))",
          "--error-border": "rgb(var(--hairline))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!bg-[rgb(var(--canvas))] !text-[rgb(var(--ink))] !border !border-[rgb(var(--hairline))] !opacity-100 !shadow-modal backdrop-blur-none",
          title: "!text-[rgb(var(--ink))] !font-semibold",
          description: "!text-[rgb(var(--mute))]",
          success: "!bg-[rgb(var(--canvas))] !opacity-100",
          error: "!bg-[rgb(var(--canvas))] !opacity-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
