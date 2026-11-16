import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Контейнер 1440 з полями 24px. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full max-w-page px-gutter", className)}
      {...props}
    />
  );
}
