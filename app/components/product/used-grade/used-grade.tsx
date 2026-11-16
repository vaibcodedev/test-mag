import { BatteryMedium, ShieldCheck } from "lucide-react";
import type { ComponentProps } from "react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

/** Значення метаполя custom.condition_grade. */
export type ConditionGrade = "Як новий" | "Відмінний" | "Хороший";

export const USED_WARRANTY_MONTHS = 6;

const CHIP_VARIANT = {
  page: "chip",
  surface: "chip-surface",
  "on-dark": "chip-on-dark",
} as const;

export type UsedGradeProps = Omit<ComponentProps<"ul">, "children"> & {
  /** Стан акумулятора у відсотках із метаполя custom.battery_health. */
  batteryHealth?: number | null;
  showWarranty?: boolean;
  /** Тло, на якому стоять чипи: біла картка, сіра плитка чи ink. */
  tone?: keyof typeof CHIP_VARIANT;
};

/** Факти про вживаний пристрій: акумулятор і гарантія. Сам стан показує Badge variant="grade". */
export function UsedGrade({
  batteryHealth,
  showWarranty = true,
  tone = "page",
  className,
  ...props
}: UsedGradeProps) {
  const hasBattery = typeof batteryHealth === "number" && Number.isFinite(batteryHealth);
  if (!hasBattery && !showWarranty) return null;
  const variant = CHIP_VARIANT[tone];

  return (
    <ul data-slot="used-grade" className={cn("flex flex-wrap gap-1.5", className)} {...props}>
      {hasBattery ? (
        <li>
          <Badge variant={variant}>
            <BatteryMedium aria-hidden="true" strokeWidth={2} />
            Акумулятор {Math.round(batteryHealth)}%
          </Badge>
        </li>
      ) : null}
      {showWarranty ? (
        <li>
          <Badge variant={variant}>
            <ShieldCheck aria-hidden="true" strokeWidth={2} />
            Гарантія {USED_WARRANTY_MONTHS} міс.
          </Badge>
        </li>
      ) : null}
    </ul>
  );
}
