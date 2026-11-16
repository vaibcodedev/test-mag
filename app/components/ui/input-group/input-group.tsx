import type { ComponentProps } from "react";

import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

/** Поле з іконкою або кнопкою всередині: пошук у шапці, поле розсилки. */
export function InputGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "relative flex h-11.5 w-full min-w-0 items-center rounded-md border border-line bg-surface transition-[border-color,box-shadow] duration-150 hover:border-ink-2 has-disabled:bg-page has-disabled:opacity-60 has-[[data-slot=input-group-control]:focus-visible]:border-blue has-[[data-slot=input-group-control]:focus-visible]:shadow-focus has-[[data-slot=input-group-control][aria-invalid=true]]:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({
  className,
  align = "start",
  ...props
}: ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center gap-2 text-small text-muted-foreground [&>svg:not([class*='size-'])]:size-5",
        align === "start" ? "order-first ps-4" : "order-last pe-1",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-full flex-1 rounded-none border-0 bg-transparent px-3 hover:border-0 focus-visible:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
