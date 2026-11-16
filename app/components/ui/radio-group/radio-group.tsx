import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { createContext, useContext, useRef, type ComponentProps, type RefObject } from "react";

import { cn } from "~/lib/utils";

const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
/** Скільки чекаємо на перехід фокуса після стрілки (Radix переводить його через setTimeout). */
const ARROW_FOCUS_WINDOW_MS = 100;

/** Позначка «фокус зараз перейде через стрілку»: спільна для всіх пунктів групи. */
const ArrowNavigationContext = createContext<RefObject<boolean> | null>(null);

/**
 * Група радіокнопок: стрілки переводять фокус і одразу вибирають пункт.
 *
 * Radix вибирає пункт на фокусі, лише поки клавішу ще не відпустили, а фокус переводить
 * через setTimeout. Швидке натискання (keydown і keyup поспіль: автоматизація, деякі
 * допоміжні технології) встигало відпустити клавішу раніше, тож фокус ішов далі, а вибір
 * лишався на місці. Тут натискання стрілки запам'ятовує сама група.
 */
export function RadioGroup({
  className,
  onKeyDownCapture,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  const arrowNavigation = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <ArrowNavigationContext.Provider value={arrowNavigation}>
      <RadioGroupPrimitive.Root
        data-slot="radio-group"
        className={cn("grid w-full gap-1", className)}
        onKeyDownCapture={(event) => {
          onKeyDownCapture?.(event);
          if (!ARROW_KEYS.includes(event.key)) return;
          arrowNavigation.current = true;
          clearTimeout(timer.current);
          // Стрілка на краю групи без loop фокус не зрушить: позначка не має зависнути.
          timer.current = setTimeout(() => {
            arrowNavigation.current = false;
          }, ARROW_FOCUS_WINDOW_MS);
        }}
        {...props}
      />
    </ArrowNavigationContext.Provider>
  );
}

/** Коло 24px; псевдоелемент розширює ціль натискання до 44px. */
export function RadioGroupItem({
  className,
  onFocus,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  const arrowNavigation = useContext(ArrowNavigationContext);

  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer relative flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-ink-2 bg-surface transition-colors duration-150 outline-none after:absolute after:-inset-2.5 hover:border-blue focus-visible:shadow-focus-offset disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger data-checked:border-blue data-checked:bg-blue",
        className,
      )}
      onFocus={(event) => {
        onFocus?.(event);
        if (!arrowNavigation?.current) return;
        arrowNavigation.current = false;
        // Уже вибраний пункт Radix повторно не перемикає, тож зайвий клік нешкідливий.
        if (event.currentTarget.getAttribute("aria-checked") !== "true") {
          event.currentTarget.click();
        }
      }}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="size-2.5 rounded-pill bg-surface"
      />
    </RadioGroupPrimitive.Item>
  );
}
