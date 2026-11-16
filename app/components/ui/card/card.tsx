import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { cardVariants, type CardVariants } from "./card.variants";

type AsChild = { asChild?: boolean };

export type CardProps = ComponentProps<"div"> & CardVariants & AsChild;

/**
 * Картка або плитка. `asChild` робить коренем інший елемент: `<article>`, `<li>`, `<Link>`.
 * Для натискної картки додайте `interactive`.
 */
export function Card({
  className,
  tone = "surface",
  padding = "md",
  interactive = false,
  asChild = false,
  ...props
}: CardProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card"
      data-tone={tone}
      data-padding={padding}
      className={cn(cardVariants({ tone, padding, interactive }), className)}
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

/** Назва картки. Рівень заголовка задає asChild: `<CardTitle asChild><h3>…</h3></CardTitle>`. */
export function CardTitle({
  className,
  asChild = false,
  ...props
}: ComponentProps<"div"> & AsChild) {
  const Comp = asChild ? Slot.Root : "div";

  return <Comp data-slot="card-title" className={cn("text-card-title", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-small text-ink-2 group-data-[tone=blue]/card:text-surface group-data-[tone=ink]/card:text-on-ink-muted",
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
