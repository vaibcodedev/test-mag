import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

import { buttonVariants, type ButtonVariants } from "./button.variants";

export type ButtonProps = ComponentProps<"button"> &
  ButtonVariants & {
    asChild?: boolean;
    /** Показує спінер і блокує повторне натискання; ширина кнопки не змінюється. */
    loading?: boolean;
  };

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  type,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={classes}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={type ?? "button"}
      className={classes}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="invisible inline-flex items-center gap-2">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
