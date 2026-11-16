import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Індикатор завантаження 20px. Колір успадковує від тексту. */
export function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <Loader2
      data-slot="spinner"
      role="status"
      aria-label="Завантаження"
      strokeWidth={2}
      className={cn("size-5 animate-spin", className)}
      {...props}
    />
  );
}
