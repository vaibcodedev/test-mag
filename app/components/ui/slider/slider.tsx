import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
  /** Підписи повзунків для читачів екрана, напр. ["Ціна від", "Ціна до"]. */
  thumbLabels?: readonly string[];
};

export function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  ...props
}: SliderProps) {
  const thumbCount = (value ?? defaultValue ?? [min]).length;

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none data-disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-pill bg-line"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-blue" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={thumbLabels?.[index]}
          className="relative block size-6 shrink-0 cursor-grab rounded-pill border-2 border-blue bg-surface transition-transform duration-150 outline-none after:absolute after:-inset-2.5 hover:scale-110 focus-visible:shadow-focus-offset active:cursor-grabbing disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
