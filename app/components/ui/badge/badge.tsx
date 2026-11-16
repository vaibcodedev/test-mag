import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { badgeVariants, type BadgeVariants } from "./badge.variants";

export type BadgeProps = ComponentProps<"span"> & BadgeVariants;

export function Badge({ className, variant = "new", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
