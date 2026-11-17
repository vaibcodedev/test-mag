import { CircleCheck, CircleX, Clock, CreditCard, Truck, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

import type { AccountOrder } from "./order-card.types";
import { orderStatuses, type OrderStatus } from "./order-status";

export type StatusBadgeProps = {
  status: OrderStatus;
  /** Що саме описує бейдж — для зчитувача екрана: «Оплата», «Доставка». */
  prefix: string;
  neutralIcon: LucideIcon;
  attentionIcon?: LucideIcon;
};

/** Бейдж стану: стан названо текстом, іконка й її колір лише підсилюють. */
export function StatusBadge({
  status,
  prefix,
  neutralIcon,
  attentionIcon = Clock,
}: StatusBadgeProps) {
  const Icon =
    status.tone === "positive"
      ? CircleCheck
      : status.tone === "attention"
        ? attentionIcon
        : neutralIcon;

  return (
    <Badge
      variant="chip"
      data-tone={status.tone}
      className={cn(
        "text-ink",
        status.tone === "positive" ? "[&>svg]:text-success" : "[&>svg]:text-ink-2",
      )}
    >
      <Icon aria-hidden="true" strokeWidth={2} />
      <span className="sr-only">{prefix}: </span>
      {status.label}
    </Badge>
  );
}

export type OrderStatusBadgesProps = Omit<ComponentProps<"ul">, "children"> & {
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">;
};

/** Стан оплати й доставки замовлення. Якщо обидва коди невідомі, нічого не рендерить. */
export function OrderStatusBadges({ order, className, ...props }: OrderStatusBadgesProps) {
  const { payment, delivery } = orderStatuses(order);
  if (!payment && !delivery) return null;

  return (
    <ul
      role="list"
      aria-label="Стан замовлення"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    >
      {payment ? (
        <li>
          <StatusBadge status={payment} prefix="Оплата" neutralIcon={CreditCard} />
        </li>
      ) : null}
      {delivery ? (
        <li>
          <StatusBadge
            status={delivery}
            prefix="Доставка"
            neutralIcon={Truck}
            attentionIcon={order.cancelledAt ? CircleX : Clock}
          />
        </li>
      ) : null}
    </ul>
  );
}
