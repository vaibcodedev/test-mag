import { CreditCard } from "lucide-react";

import { Badge, type BadgeProps } from "~/components/ui/badge";
import { formatPrice, installmentPayment, type Money } from "~/lib/format";

export const DEFAULT_INSTALLMENT_MONTHS = 25;

const CHIP_VARIANT = {
  page: "chip",
  surface: "chip-surface",
  "on-dark": "chip-on-dark",
} as const;

export type InstallmentChipProps = Omit<BadgeProps, "children" | "variant"> & {
  price: Money;
  /** Кількість платежів із метаполя custom.installment_months. */
  months?: number | null;
  showIcon?: boolean;
  /** Тло, на якому стоїть чип: біла картка, сіра сторінка чи ink. */
  tone?: keyof typeof CHIP_VARIANT | null;
};

/** Умова оплати частинами: «4 800 ₴ × 25 міс.». */
export function InstallmentChip({
  price,
  months,
  showIcon = false,
  tone = "page",
  ...props
}: InstallmentChipProps) {
  const count = months ?? DEFAULT_INSTALLMENT_MONTHS;
  const payment = installmentPayment(price, count);
  if (!payment) return null;

  return (
    <Badge variant={CHIP_VARIANT[tone ?? "page"]} {...props} data-slot="installment-chip">
      {showIcon ? <CreditCard aria-hidden="true" strokeWidth={2} /> : null}
      <span>
        <span className="sr-only">Оплата частинами: </span>
        {formatPrice(payment)} × {count} міс.
      </span>
    </Badge>
  );
}
