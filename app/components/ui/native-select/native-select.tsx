import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { fieldClassName } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export type NativeSelectProps = Omit<ComponentProps<"select">, "size">;

/**
 * Нативний <select> у вигляді поля: працює без JavaScript і відкриває системний список
 * на телефоні. className потрапляє на обгортку (ширина), решта пропсів — на <select>.
 */
export function NativeSelect({ className, ...props }: NativeSelectProps) {
  return (
    <div
      data-slot="native-select-wrapper"
      className={cn("group/native-select relative w-full min-w-0", className)}
    >
      <select
        data-slot="native-select"
        className={cn(fieldClassName, "h-11.5 cursor-pointer appearance-none pe-12")}
        {...props}
      />
      <ChevronDown
        data-slot="native-select-icon"
        aria-hidden="true"
        strokeWidth={2}
        className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-ink-2 group-has-[select:disabled]/native-select:opacity-45"
      />
    </div>
  );
}

export function NativeSelectOption(props: ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />;
}

export function NativeSelectOptGroup(props: ComponentProps<"optgroup">) {
  return <optgroup data-slot="native-select-optgroup" {...props} />;
}
