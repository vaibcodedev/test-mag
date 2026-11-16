import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

import {
  itemMediaVariants,
  itemVariants,
  type ItemMediaVariants,
  type ItemVariants,
} from "./item.variants";

type AsChild = { asChild?: boolean };

/**
 * Стовпчик рядків. Для семантичного списку: `<ItemGroup asChild><ul>…</ul></ItemGroup>`
 * і кожен Item усередині свого `<li>`.
 */
export function ItemGroup({
  className,
  asChild = false,
  ...props
}: ComponentProps<"div"> & AsChild) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="item-group"
      className={cn("group/item-group flex w-full min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

export function ItemSeparator({ className, ...props }: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={className}
      {...props}
    />
  );
}

export type ItemProps = ComponentProps<"div"> & ItemVariants & AsChild;

/** Рядок: переваги, сервіси, контакти, способи доставки, підказки пошуку. */
export function Item({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: ItemProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export type ItemMediaProps = ComponentProps<"div"> & ItemMediaVariants & AsChild;

/** Іконка, плитка з іконкою або мініатюра фото ліворуч від тексту. */
export function ItemMedia({
  className,
  variant = "default",
  size = "md",
  tone = "light",
  asChild = false,
  ...props
}: ItemMediaProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, size, tone }), className)}
      {...props}
    />
  );
}

export function ItemContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className,
      )}
      {...props}
    />
  );
}

/** Заголовок рядка. Рівень заголовка задає asChild: `<ItemTitle asChild><h3>…</h3></ItemTitle>`. */
export function ItemTitle({
  className,
  asChild = false,
  ...props
}: ComponentProps<"div"> & AsChild) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="item-title"
      className={cn("flex w-fit items-center gap-2 text-card-title", className)}
      {...props}
    />
  );
}

export function ItemDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "text-start text-small text-ink-2 group-data-[variant=on-dark]/item:text-on-ink-muted [&>a]:text-blue [&>a]:underline [&>a]:underline-offset-4 group-data-[variant=on-dark]/item:[&>a]:text-surface",
        className,
      )}
      {...props}
    />
  );
}

export function ItemActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export function ItemHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

export function ItemFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}
