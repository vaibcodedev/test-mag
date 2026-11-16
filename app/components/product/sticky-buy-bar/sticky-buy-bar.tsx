import { ShoppingCart } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "~/components/ui/button";
import { Price } from "~/components/ui/price";
import type { Money } from "~/lib/format";
import { cn } from "~/lib/utils";

export type StickyBuyBarProps = Omit<ComponentProps<"div">, "children" | "title"> & {
  /** Панель показана. Схована панель недоступна ні з клавіатури, ні читачам екрана. */
  visible: boolean;
  title: string;
  price: Money;
  compareAt?: Money | null;
  /** id форми «Купити» на сторінці: кнопка панелі надсилає саме її. */
  formId: string;
  /** name і type кнопки з register("addToCart") форми товару. */
  submit: { name: string; type: "submit" };
  /** Товар додається в кошик. */
  pending?: boolean;
};

/**
 * Липка панель «Купити» на мобільному. Стоїть над нижньою навігацією сайту
 * (64px + межа + safe-area) і показується, коли головна кнопка зникла з екрана.
 */
export function StickyBuyBar({
  visible,
  title,
  price,
  compareAt,
  formId,
  submit,
  pending = false,
  className,
  ...props
}: StickyBuyBarProps) {
  return (
    <div
      data-slot="sticky-buy-bar"
      data-visible={visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface transition-[translate,opacity] duration-200 ease-soft lg:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 px-gutter py-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-caption text-ink-2">{title}</p>
          <Price price={price} compareAt={compareAt} showSavings={false} />
        </div>
        <Button {...submit} form={formId} loading={pending} className="shrink-0">
          <ShoppingCart aria-hidden="true" strokeWidth={2} />
          Купити
        </Button>
      </div>
    </div>
  );
}
