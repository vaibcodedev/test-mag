import { Check, CircleAlert } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import type { AccountOrder } from "./order-card.types";
import { orderProgress, type OrderProgressStep } from "./order-status";

export type OrderProgressProps = Omit<ComponentProps<"ol">, "children"> & {
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">;
};

/** Стан етапу словами — для зчитувача екрана: колір і форма кружка його лише дублюють. */
const STATE_TEXT: Record<OrderProgressStep["state"], string> = {
  done: "пройдено",
  current: "триває зараз",
  upcoming: "попереду",
  problem: "потребує уваги",
};

/** Кружок етапу: галочка — пройдено, крапка в кільці — триває, порожнє кільце — попереду. */
function StepMark({ state }: { state: OrderProgressStep["state"] }) {
  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-pill border-2",
        state === "done" && "border-blue bg-blue text-surface",
        // Поточний етап — із м'яким ореолом, щоб око одразу знаходило «де ми зараз».
        state === "current" && "border-blue bg-surface ring-4 ring-blue/15",
        state === "upcoming" && "border-line bg-surface",
        state === "problem" && "border-danger bg-surface text-danger ring-4 ring-danger/15",
      )}
    >
      {state === "done" ? <Check strokeWidth={3} className="size-4" /> : null}
      {state === "current" ? <span className="size-2.5 rounded-pill bg-blue" /> : null}
      {state === "problem" ? <CircleAlert strokeWidth={2.5} className="size-4" /> : null}
    </span>
  );
}

/**
 * Шлях замовлення: повний ланцюжок етапів на всю ширину картки. Пройдені етапи й лінія до
 * них зафарбовані, поточний виділено ореолом і підписом, майбутні — сірі. У вузькій картці
 * етапи стають стовпчиком, щоб підписи не рвалися. Скасоване замовлення шляху не має.
 */
export function OrderProgress({ order, className, ...props }: OrderProgressProps) {
  const steps = orderProgress(order);
  if (!steps) return null;

  return (
    <div className="@container">
      <ol
        role="list"
        aria-label="Стан замовлення"
        data-slot="order-progress"
        className={cn("flex flex-col gap-4 @[30rem]:flex-row @[30rem]:gap-0", className)}
        {...props}
      >
        {steps.map((step, index) => {
          const next = steps[index + 1];
          // Відрізок зафарбовано, коли етап, до якого він веде, пройдено.
          const filled = step.state === "done";
          const nextFilled = next?.state === "done";

          return (
            <li
              key={step.key}
              data-state={step.state}
              aria-current={step.state === "current" ? "step" : undefined}
              className={cn(
                "relative flex min-w-0 items-center gap-3",
                "@[30rem]:flex-1 @[30rem]:basis-0 @[30rem]:flex-col @[30rem]:gap-2 @[30rem]:text-center",
              )}
            >
              {/* Рядок: відрізок від центру попереднього етапу до центру цього. */}
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  data-slot="order-progress-line"
                  className={cn(
                    "absolute top-3.5 right-1/2 hidden h-0.5 w-full -translate-y-1/2 @[30rem]:block",
                    filled ? "bg-blue" : "bg-line",
                  )}
                />
              ) : null}
              {/* Стовпчик: відрізок униз до наступного етапу. */}
              {next ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute start-[calc(0.875rem-1px)] top-7 -bottom-4 w-0.5 @[30rem]:hidden",
                    nextFilled ? "bg-blue" : "bg-line",
                  )}
                />
              ) : null}
              <StepMark state={step.state} />
              <span
                className={cn(
                  "min-w-0 text-small wrap-anywhere @[30rem]:px-1",
                  step.state === "upcoming" ? "text-muted-foreground" : "text-ink",
                  step.state === "current" || step.state === "problem"
                    ? "font-semibold"
                    : "font-medium",
                )}
              >
                {step.label}
                <span className="sr-only">: {STATE_TEXT[step.state]}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
