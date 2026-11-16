import { useEffect, useRef, useState, type ComponentProps } from "react";
import { flushSync } from "react-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SORT_OPTIONS, SORT_PARAM, type SortOption } from "~/lib/shopify/collection";
import { cn } from "~/lib/utils";

export type SortSelectProps = Omit<
  ComponentProps<"form">,
  "action" | "method" | "children" | "onChange"
> & {
  /** Поточне значення sort_by. */
  value: string;
  /** Адреса колекції для GET-форми. */
  action: string;
  options?: readonly SortOption[];
  /** Увімкнені фільтри: приховані поля, щоб сортування їх не скинуло. */
  hiddenParams?: readonly (readonly [name: string, value: string])[];
};

/**
 * Сортування колекції на shadcn Select. Вибір одразу надсилає GET-форму:
 * значення лежить у прихованому полі sort_by, тож адреса лишається тією самою,
 * що й раніше, а сторінка оновлюється без перезавантаження.
 */
export function SortSelect({
  value,
  action,
  options = SORT_OPTIONS,
  hiddenParams = [],
  className,
  ...props
}: SortSelectProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [current, setCurrent] = useState(value);

  // Значення з адреси головне: «назад» у браузері чи скидання фільтрів мають оновити список.
  useEffect(() => {
    setCurrent(value);
  }, [value]);

  const handleChange = (next: string) => {
    // Приховане поле має отримати нове значення до надсилання форми.
    flushSync(() => setCurrent(next));
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      data-slot="sort-select"
      className={cn("flex min-w-0 items-center gap-2", className)}
      {...props}
      method="get"
      action={action}
    >
      {hiddenParams.map(([name, paramValue], index) => (
        <input
          key={`${name}-${paramValue}-${index}`}
          type="hidden"
          name={name}
          value={paramValue}
        />
      ))}
      <input type="hidden" name={SORT_PARAM} value={current} />
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger aria-label="Сортування" className="min-w-56 font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
