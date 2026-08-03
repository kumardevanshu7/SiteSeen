"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors={false}
      closeButton={false}
      icons={{
        success: <CircleCheckIcon className="size-4 text-white" />,
        info: <InfoIcon className="size-4 text-white" />,
        warning: <TriangleAlertIcon className="size-4 text-white" />,
        error: <OctagonXIcon className="size-4 text-white" />,
        loading: <Loader2Icon className="size-4 animate-spin text-white" />,
      }}
      toastOptions={{
        classNames: {
          toast: "siteseen-toast",
          title: "siteseen-toast-title",
          description: "siteseen-toast-desc",
          success: "siteseen-toast",
          error: "siteseen-toast",
          warning: "siteseen-toast",
          info: "siteseen-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
