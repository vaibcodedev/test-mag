import { Badge, type BadgeProps } from "~/components/ui/badge";

import type { ChipVariants } from "./chip.variants";

export type ChipProps = Omit<BadgeProps, "variant"> & ChipVariants;

const CHIP_BADGE_VARIANT = {
  page: "chip",
  surface: "chip-surface",
  "on-dark": "chip-on-dark",
} as const;

/**
 * Невелика плашка з умовою чи характеристикою: «4 800 ₴ × 25 міс.», «256 ГБ».
 * Тонкий псевдонім Badge із варіантами chip / chip-surface / chip-on-dark.
 */
export function Chip({ tone = "page", ...props }: ChipProps) {
  return <Badge data-slot="chip" variant={CHIP_BADGE_VARIANT[tone ?? "page"]} {...props} />;
}
