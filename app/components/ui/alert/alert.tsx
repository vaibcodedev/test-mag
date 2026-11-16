import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { alertVariants, type AlertVariants } from "./alert.variants";

export type AlertProps = ComponentProps<"div"> & AlertVariants;

/**
 * Повідомлення в потоці сторінки. Перша дитина-іконка lucide стає ліворуч від тексту.
 * Помилка (danger) має role="alert" і зачитується одразу, решта — role="status".
 */
export function Alert({ className, variant = "info", ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={variant === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-ink-2 group-has-[>svg]/alert:col-start-2 group-data-[variant=on-dark]/alert:text-on-ink-muted [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-4 group-data-[variant=on-dark]/alert:[&_a]:text-surface [&_p:not(:last-child)]:mb-2",
        className,
      )}
      {...props}
    />
  );
}

/** Місце у правому верхньому куті під кнопку-іконку 44px: «Закрити», «Повторити». */
export function AlertAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="alert-action" className={cn("absolute end-1 top-0.5", className)} {...props} />
  );
}
