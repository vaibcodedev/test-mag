import { Check, CircleSlash } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export type StockStatusProps = Omit<ComponentProps<"p">, "children"> & {
  available: boolean;
  /** Готовий підпис про доставку, напр. «доставимо завтра» або «доставимо 18 листопада». */
  delivery?: string | null;
};

/** «В наявності» з Check і датою доставки або «Немає в наявності». */
export function StockStatus({ available, delivery, className, ...props }: StockStatusProps) {
  return (
    <p
      data-slot="stock-status"
      data-available={available}
      className={cn(
        "flex items-center gap-1.5 text-caption",
        available ? "text-success" : "text-muted-foreground",
        className,
      )}
      {...props}
    >
      {available ? (
        <Check aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
      ) : (
        <CircleSlash aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
      )}
      <span>
        <span className="font-semibold">{available ? "В наявності" : "Немає в наявності"}</span>
        {available && delivery ? <span className="text-ink-2">, {delivery}</span> : null}
      </span>
    </p>
  );
}
