import { Check, CircleAlert } from "lucide-react";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "~/lib/utils";

import type { AccountOrder } from "./order-card.types";
import { orderProgress, type OrderProgressStep } from "./order-status";

export type OrderProgressProps = Omit<ComponentProps<"ol">, "children"> & {
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">;
};

/** Пройдений крок не уточнюємо: його підпис («Оплачено», «Виконано») уже каже все. */
const STATE_TEXT: Partial<Record<OrderProgressStep["state"], string>> = {
  current: "триває",
  upcoming: "попереду",
  problem: "потребує уваги",
};

/** Кружок кроку: стан видно за формою (галочка, крапка, порожнє кільце, знак), а не лише кольором. */
function StepMark({ state }: { state: OrderProgressStep["state"] }) {
  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn(
        "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-pill border-2",
        state === "done" && "border-blue bg-blue text-surface",
        state === "current" && "border-blue bg-surface",
        state === "upcoming" && "border-line bg-surface",
        state === "problem" && "border-danger bg-surface text-danger",
      )}
    >
      {state === "done" ? <Check strokeWidth={3} className="size-3.5" /> : null}
      {state === "current" ? <span className="size-2 rounded-pill bg-blue" /> : null}
      {state === "problem" ? <CircleAlert strokeWidth={2.5} className="size-3.5" /> : null}
    </span>
  );
}

/** Діаметр кружка: відрізок лінії починається й закінчується біля його краю. */
const MARK = "1.5rem";

/**
 * Де лежить горизонтальний відрізок від кроку до наступного. Колонки рівні; перший кружок
 * стоїть біля лівого краю своєї колонки, останній — біля правого, середні — по центру.
 */
function segmentInsets(index: number, count: number): CSSProperties {
  return {
    "--seg-start": index === 0 ? MARK : `calc(50% + ${MARK} / 2)`,
    "--seg-end": index + 1 === count - 1 ? `calc(-100% + ${MARK})` : `calc(-50% + ${MARK} / 2)`,
  } as CSSProperties;
}

/**
 * Шлях замовлення кроками: «Оформлено → оплата → доставка». Заповнена частина лінії показує,
 * скільки вже пройдено. У вузькій картці кроки стають стовпчиком, щоб довгі підписи не
 * рвалися посеред слова. Скасоване замовлення шляху не має.
 */
export function OrderProgress({ order, className, ...props }: OrderProgressProps) {
  const steps = orderProgress(order);
  if (!steps) return null;

  return (
    <div className="@container max-w-2xl">
      <ol
        role="list"
        aria-label="Стан замовлення"
        data-slot="order-progress"
        className={cn("flex flex-col gap-3 @[17rem]:flex-row @[17rem]:gap-0", className)}
        {...props}
      >
        {steps.map((step, index) => {
          const first = index === 0;
          const next = steps[index + 1];
          // Відрізок до наступного кроку зафарбований, коли той уже почався.
          const reached = next?.state === "done" || next?.state === "current";

          return (
            <li
              key={step.key}
              data-state={step.state}
              className={cn(
                "relative flex min-w-0 items-start gap-3 text-start",
                "@[17rem]:flex-1 @[17rem]:basis-0 @[17rem]:flex-col @[17rem]:gap-2",
                !first && next && "@[17rem]:items-center @[17rem]:text-center",
                !first && !next && "@[17rem]:items-end @[17rem]:text-end",
              )}
            >
              {next ? (
                <span
                  aria-hidden="true"
                  data-slot="order-progress-line"
                  style={segmentInsets(index, steps.length)}
                  className={cn(
                    "absolute start-[calc(0.75rem-1px)] top-6 -bottom-3 w-0.5 rounded-pill",
                    "@[17rem]:start-(--seg-start) @[17rem]:end-(--seg-end) @[17rem]:top-3 @[17rem]:bottom-auto @[17rem]:h-0.5 @[17rem]:w-auto @[17rem]:-translate-y-1/2",
                    reached ? "bg-blue" : "bg-line",
                  )}
                />
              ) : null}
              <StepMark state={step.state} />
              <span
                className={cn(
                  "max-w-full min-w-0 pt-0.5 text-caption font-semibold wrap-anywhere @[17rem]:pt-0 @[17rem]:text-balance",
                  !first && next && "@[17rem]:px-1",
                  step.state === "upcoming" ? "text-muted-foreground" : "text-ink",
                )}
              >
                <span className="sr-only">{step.prefix}: </span>
                {step.label}
                {STATE_TEXT[step.state] ? (
                  <span className="sr-only">, {STATE_TEXT[step.state]}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
