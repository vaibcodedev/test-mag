import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

import { buttonGroupVariants, type ButtonGroupVariants } from "./button-group.variants";

export type ButtonGroupProps = ComponentProps<"div"> & ButtonGroupVariants;

/**
 * Група зі спільним контуром: лічильник кількості (мінус, число, плюс), поле з кнопкою.
 * Усередину кладіть Button variant="ghost" і Input; групі потрібен aria-label.
 */
export function ButtonGroup({ className, orientation = "horizontal", ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

/** Незмінний текст у групі: одиниця виміру, префікс «+380». */
export function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="button-group-text"
      className={cn(
        "flex items-center gap-2 rounded-md bg-page px-4 text-small font-semibold text-ink-2 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    />
  );
}

/** Лінія між елементами. У групі зі спільним контуром зазвичай не потрібна: межі вже є. */
export function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn("data-horizontal:h-0 data-vertical:w-0", className)}
      {...props}
    />
  );
}
