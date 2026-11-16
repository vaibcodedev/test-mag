import type { ComponentProps } from "react";

import { useCountdown, type CountdownTime } from "~/hooks/use-countdown";
import { plural, type PluralForms } from "~/lib/format";
import { cn } from "~/lib/utils";

import {
  countdownCellVariants,
  countdownFinishedVariants,
  countdownLabelVariants,
  countdownValueVariants,
  type CountdownTone,
} from "./countdown.variants";

type Unit = "days" | "hours" | "minutes" | "seconds";

const UNITS: { key: Unit; forms: PluralForms }[] = [
  { key: "days", forms: { one: "день", few: "дні", many: "днів" } },
  { key: "hours", forms: { one: "година", few: "години", many: "годин" } },
  { key: "minutes", forms: { one: "хвилина", few: "хвилини", many: "хвилин" } },
  { key: "seconds", forms: { one: "секунда", few: "секунди", many: "секунд" } },
];

/** Що видно, доки браузер не порахував час (сервер не знає годинника відвідувача). */
const PLACEHOLDER = "––";

export type CountdownProps = Omit<ComponentProps<"div">, "children"> & {
  /** Момент завершення в ISO 8601: «2026-11-22T23:59:59+02:00». */
  endsAt: string;
  /**
   * Час сервера з loader. З ним цифри є вже в HTML; без нього сервер віддає прочерки,
   * а значення з'являються після гідрації. В обох випадках розмітка збігається.
   */
  now?: string | number | null;
  label?: string;
  finishedText?: string;
  /** ink — на темній панелі (цифри lime); light — на білому чи сірому тлі. */
  tone?: CountdownTone;
};

/** Підпис для скринрідера без секунд, щоб він не змінювався щосекунди. */
function spokenTime(time: CountdownTime): string {
  const parts = UNITS.filter(
    ({ key }) => key !== "seconds" && (key !== "days" || time.days > 0),
  ).map(({ key, forms }) => `${time[key]} ${plural(time[key], forms)}`);
  return time.totalSeconds < 60 ? "менше хвилини" : parts.join(", ");
}

/** Зворотний відлік до кінця акції: дні, години, хвилини, секунди. */
export function Countdown({
  endsAt,
  now,
  label = "До кінця акції",
  finishedText = "Акцію завершено",
  tone = "ink",
  className,
  ...props
}: CountdownProps) {
  const time = useCountdown(endsAt, now);

  if (time?.finished) {
    return (
      <div
        data-slot="countdown"
        data-finished="true"
        role="timer"
        aria-live="off"
        className={cn(countdownFinishedVariants({ tone }), className)}
        {...props}
      >
        {finishedText}
      </div>
    );
  }

  return (
    <div
      data-slot="countdown"
      role="timer"
      aria-live="off"
      aria-atomic="true"
      aria-label={time ? `${label}: ${spokenTime(time)}` : label}
      className={cn("flex w-fit max-w-full flex-col gap-2", className)}
      {...props}
    >
      <p aria-hidden="true" className={cn("text-small", countdownLabelVariants({ tone }))}>
        {label}
      </p>
      <dl aria-hidden="true" className="flex gap-2">
        {UNITS.map(({ key, forms }) => (
          <div key={key} data-unit={key} className={countdownCellVariants({ tone })}>
            <dt className={cn("text-caption", countdownLabelVariants({ tone }))}>
              {plural(time?.[key] ?? 0, forms)}
            </dt>
            <dd className={countdownValueVariants({ tone })}>
              {time ? String(time[key]).padStart(2, "0") : PLACEHOLDER}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
