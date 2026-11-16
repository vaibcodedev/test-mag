import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Спільний вигляд текстових полів: Input, Textarea, SelectTrigger. */
export const fieldClassName =
  "w-full min-w-0 rounded-md border border-line bg-surface px-4 text-body text-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground hover:border-ink-2 focus-visible:border-blue focus-visible:shadow-focus disabled:pointer-events-none disabled:bg-page disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus-visible:shadow-none";

/**
 * Біле поле на ink: рамка зливається з полем, фокус показує lime-кільце (і на полі з помилкою),
 * помилку — danger-рамка 2px.
 */
export const fieldOnDarkClassName =
  "border-2 border-surface hover:border-surface focus-visible:border-surface focus-visible:shadow-focus-on-ink aria-invalid:border-danger aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:shadow-focus-on-ink";

export type InputProps = ComponentProps<"input"> & {
  /** Поле стоїть на ink (розсилка, темні секції). */
  onDark?: boolean;
};

export function Input({ className, type = "text", onDark = false, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-on-dark={onDark ? "true" : undefined}
      className={cn(fieldClassName, "h-11.5", onDark && fieldOnDarkClassName, className)}
      {...props}
    />
  );
}
