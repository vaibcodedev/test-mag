import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import type { AccountOrder } from "./order-card.types";
import { orderProgress, type OrderProgressStep } from "./order-status";

export type OrderProgressProps = Omit<ComponentProps<"ol">, "children"> & {
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">;
};

/** Стан етапу словами — для зчитувача екрана: колір сегмента його лише дублює. */
const STATE_TEXT: Record<OrderProgressStep["state"], string> = {
  done: "пройдено",
  current: "триває зараз",
  upcoming: "попереду",
  problem: "потребує уваги",
};

/**
 * Сегмент смуги: пройдений — суцільний, поточний — заповнений наполовину, майбутній — сірий.
 * Форму заповнення видно й без кольору.
 */
function Segment({ state }: { state: OrderProgressStep["state"] }) {
  const half = state === "current" || state === "problem";

  return (
    <span
      aria-hidden="true"
      data-slot="order-progress-segment"
      data-state={state}
      className={cn(
        "block h-1.5 overflow-hidden rounded-pill",
        state === "done" && "bg-blue",
        state === "current" && "bg-blue/20",
        state === "problem" && "bg-danger/20",
        state === "upcoming" && "bg-line",
      )}
    >
      {half ? (
        <span
          className={cn(
            "block h-full w-1/2 rounded-pill",
            state === "problem" ? "bg-danger" : "bg-blue",
          )}
        />
      ) : null}
    </span>
  );
}

/**
 * Шлях замовлення тонкою смугою з чотирьох сегментів на всю ширину картки: видно і пройдене,
 * і поточний етап, і те, що попереду. У широкій картці під кожним сегментом — його назва;
 * у вузькій назви не вміщаються, тож під смугою один рядок «Етап 3 із 4: …».
 * Скасоване замовлення шляху не має.
 */
export function OrderProgress({ order, className, ...props }: OrderProgressProps) {
  const steps = orderProgress(order);
  if (!steps) return null;

  const activeIndex = steps.findIndex((step) => step.state !== "done");
  const active = steps[activeIndex];

  return (
    <div data-slot="order-progress-box" className="@container flex flex-col gap-2">
      <ol
        role="list"
        aria-label="Стан замовлення"
        data-slot="order-progress"
        className={cn("grid auto-cols-fr grid-flow-col gap-1.5", className)}
        {...props}
      >
        {steps.map((step) => (
          <li
            key={step.key}
            data-state={step.state}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex min-w-0 flex-col gap-2"
          >
            <Segment state={step.state} />
            {/* У вузькій картці назву чує лише зчитувач екрана: видимий підпис — під смугою. */}
            <span
              className={cn(
                "sr-only text-caption wrap-anywhere @[32rem]:not-sr-only",
                step.state === "upcoming" ? "text-muted-foreground" : "text-ink",
                step.state === "current" || step.state === "problem" ? "font-semibold" : null,
              )}
            >
              {step.label}
              <span className="sr-only">: {STATE_TEXT[step.state]}</span>
            </span>
          </li>
        ))}
      </ol>
      <p
        aria-hidden="true"
        data-slot="order-progress-caption"
        className="text-caption text-ink-2 @[32rem]:hidden"
      >
        {active ? (
          <>
            Етап {activeIndex + 1} із {steps.length}:{" "}
            <span className="font-semibold text-ink">{active.label}</span>
          </>
        ) : (
          "Усі етапи пройдено"
        )}
      </p>
    </div>
  );
}
