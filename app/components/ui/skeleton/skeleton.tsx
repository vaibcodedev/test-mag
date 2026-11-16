import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Заглушка на час завантаження. Декоративна: стан озвучує батьківський aria-busy. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-page", className)}
      {...props}
    />
  );
}
