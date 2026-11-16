import { Star } from "lucide-react";
import type { ComponentProps } from "react";

import { formatDecimal, formatInteger, plural } from "~/lib/format";
import { cn } from "~/lib/utils";

import { ratingCountVariants, ratingStarVariants, ratingValueVariants } from "./rating.variants";

const MAX_RATING = 5;
const STARS = Array.from({ length: MAX_RATING }, (_, index) => index + 1);

export type RatingProps = Omit<ComponentProps<"div">, "children"> & {
  /** Від 0 до 5. */
  value: number;
  /** Кількість відгуків. */
  count?: number;
  /** compact: одна зірка й число, для вузьких карток. */
  variant?: "stars" | "compact";
  onDark?: boolean;
};

export function Rating({
  value,
  count,
  variant = "stars",
  onDark = false,
  className,
  ...props
}: RatingProps) {
  const clamped = Math.min(MAX_RATING, Math.max(0, value));
  const filled = Math.round(clamped);
  const reviews =
    count === undefined
      ? ""
      : `, ${formatInteger(count)} ${plural(count, { one: "відгук", few: "відгуки", many: "відгуків" })}`;

  return (
    <div
      data-slot="rating"
      role="img"
      aria-label={`Оцінка ${formatDecimal(clamped)} з ${MAX_RATING}${reviews}`}
      className={cn("inline-flex items-center gap-1.5 text-small", className)}
      {...props}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {(variant === "compact" ? [1] : STARS).map((star) => (
          <Star
            key={star}
            strokeWidth={2}
            className={ratingStarVariants({
              filled: star <= filled || variant === "compact",
              onDark,
            })}
          />
        ))}
      </span>
      <span aria-hidden="true" className={ratingValueVariants({ onDark })}>
        {formatDecimal(clamped)}
      </span>
      {count === undefined ? null : (
        <span aria-hidden="true" className={ratingCountVariants({ onDark })}>
          ({formatInteger(count)})
        </span>
      )}
    </div>
  );
}
