import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { itemMediaVariants } from "~/components/ui/item";
import { cn } from "~/lib/utils";

import { emptyVariants, type EmptyVariants } from "./empty.variants";

export type EmptyProps = ComponentProps<"div"> &
  EmptyVariants & {
    /**
     * Розмір заголовка незалежно від полів. Типово h2, для size="sm" — h3. Під h1 сторінки
     * (порожній каталог, порожній список колекцій) беріть size="panel" titleSize="h3".
     */
    titleSize?: "h2" | "h3";
  };

/** Порожній стан: що тут буде і що зробити далі. */
export function Empty({
  className,
  size = "md",
  centered = false,
  titleSize,
  ...props
}: EmptyProps) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      data-title-size={titleSize ?? (size === "sm" ? "h3" : "h2")}
      data-centered={centered ? "true" : "false"}
      className={cn(emptyVariants({ size, centered }), className)}
      {...props}
    />
  );
}

export function EmptyHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-xl flex-col items-start gap-2 group-data-[centered=true]/empty:items-center",
        className,
      )}
      {...props}
    />
  );
}

export type EmptyMediaProps = ComponentProps<"div"> & {
  /** icon — плитка 52px під іконкою lucide; default — довільна ілюстрація без тла. */
  variant?: "icon" | "default";
};

export function EmptyMedia({ className, variant = "icon", ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      aria-hidden={variant === "icon" ? "true" : undefined}
      className={cn(
        "mb-2",
        variant === "icon"
          ? itemMediaVariants({ variant: "icon", size: "lg", tone: "light" })
          : "flex shrink-0 items-center justify-center",
        className,
      )}
      {...props}
    />
  );
}

type EmptyTitleTag = "h1" | "h2" | "h3" | "h4" | "p" | "div";

export type EmptyTitleProps = ComponentProps<"h2"> & {
  /** Рівень заголовка: h1 на порожній сторінці, h2 чи h3 усередині секції або шухляди. */
  as?: EmptyTitleTag;
  asChild?: boolean;
};

export function EmptyTitle({ className, as = "h2", asChild = false, ...props }: EmptyTitleProps) {
  const Comp = asChild ? Slot.Root : as;

  return (
    <Comp
      data-slot="empty-title"
      className={cn("text-h2 text-ink group-data-[title-size=h3]/empty:text-h3", className)}
      {...props}
    />
  );
}

export function EmptyDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        // Посилання в тексті підкреслене завжди: сам колір не відрізняє його від тексту (WCAG 1.4.1).
        "text-body text-ink-2 [&>a]:text-blue [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

/** Дії, які виводять із порожнього стану: «Перейти в каталог». */
export function EmptyContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-3 group-data-[centered=true]/empty:justify-center",
        className,
      )}
      {...props}
    />
  );
}
