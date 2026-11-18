import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import {
  cardTitleVariants,
  cardVariants,
  type CardTitleVariants,
  type CardVariants,
} from "./card.variants";

type AsChild = { asChild?: boolean };

export type CardProps = ComponentProps<"div"> & CardVariants & AsChild;

/**
 * Картка або плитка. `asChild` робить коренем інший елемент: `<article>`, `<li>`, `<Link>`.
 * Для натискної картки додайте `interactive`. `size="panel"` — панель-секція: радіус xl
 * і адаптивні поля 24 → 40 (їх можна перевизначити пропом `padding`).
 */
export function Card({
  className,
  size = "card",
  tone = "surface",
  padding,
  interactive = false,
  asChild = false,
  ...props
}: CardProps) {
  const Comp = asChild ? Slot.Root : "div";
  const resolvedPadding = padding ?? (size === "panel" ? "panel" : "md");

  return (
    <Comp
      data-slot="card"
      data-size={size}
      data-tone={tone}
      data-padding={resolvedPadding}
      className={cn(cardVariants({ size, tone, padding: resolvedPadding, interactive }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  );
}

export type CardTitleProps = ComponentProps<"div"> & AsChild & CardTitleVariants;

/**
 * Назва картки. Рівень заголовка задає asChild: `<CardTitle asChild><h3>…</h3></CardTitle>`,
 * розмір — проп `size` (`card` | `h3` | `h2-panel`).
 */
export function CardTitle({ className, size = "card", asChild = false, ...props }: CardTitleProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card-title"
      className={cn(cardTitleVariants({ size }), className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-small text-ink-2 group-data-[tone=blue]/card:text-on-accent group-data-[tone=ink]/card:text-on-ink-muted group-data-[tone=on-ink]/card:text-on-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

/** Дія у правому верхньому куті шапки: «в обране», «закрити». */
export function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("min-w-0", className)} {...props} />;
}

/** Низ картки: ціна й кнопка. Притискається донизу, коли картки в рядку різної висоти. */
export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-auto flex items-center gap-3", className)}
      {...props}
    />
  );
}
