import { Slot, ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { createContext, useContext, type ComponentProps } from "react";

import {
  ToggleSwatch,
  toggleVariants,
  type ToggleSwatchProps,
  type ToggleVariants,
} from "~/components/ui/toggle";
import { cn } from "~/lib/utils";

const ToggleGroupContext = createContext<ToggleVariants>({ variant: "pill", onDark: false });

export type ToggleGroupProps = ComponentProps<typeof ToggleGroupPrimitive.Root> & ToggleVariants;

/**
 * Група перемикачів. `type="single"` — вибір одного (пам'ять, колір): радіогрупа зі
 * стрілками клавіатури; `type="multiple"` — кілька незалежних. Потребує aria-label.
 * Варіант і onDark успадковують усі елементи групи.
 */
export function ToggleGroup({
  className,
  variant = "pill",
  onDark = false,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      className={cn(
        "group/toggle-group flex w-fit max-w-full flex-wrap items-center data-vertical:flex-col data-vertical:items-stretch",
        variant === "swatch" ? "gap-0" : "gap-2",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, onDark }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

export type ToggleGroupItemProps = ComponentProps<typeof ToggleGroupPrimitive.Item> &
  ToggleVariants &
  ToggleSwatchProps;

/**
 * Елемент групи. З `asChild` коренем стає дитина — наприклад, посилання на варіант товару:
 * `<ToggleGroupItem asChild value="…" swatch="#…"><Link to="…" /></ToggleGroupItem>`.
 * Крапка кольору потрапляє всередину цієї дитини (children загорнуті в Slottable).
 */
export function ToggleGroupItem({
  className,
  children,
  variant,
  onDark,
  swatch,
  unavailable,
  ...props
}: ToggleGroupItemProps) {
  const context = useContext(ToggleGroupContext);
  const resolvedVariant = variant ?? context.variant;
  const resolvedOnDark = onDark ?? context.onDark;

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={resolvedVariant}
      data-available={unavailable ? "false" : undefined}
      className={cn(
        toggleVariants({ variant: resolvedVariant, onDark: resolvedOnDark }),
        "focus-visible:z-10",
        className,
      )}
      {...props}
    >
      {swatch ? <ToggleSwatch color={swatch} onDark={resolvedOnDark} /> : null}
      <Slot.Slottable>{children}</Slot.Slottable>
    </ToggleGroupPrimitive.Item>
  );
}
