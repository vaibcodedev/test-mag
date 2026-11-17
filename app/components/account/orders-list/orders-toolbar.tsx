import type { ComponentProps } from "react";
import { useNavigate } from "react-router";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ORDER_PERIODS,
  ORDER_SORTS,
  ordersListSearch,
  type OrdersListChoice,
} from "~/lib/account/orders-list";
import { cn } from "~/lib/utils";

export type OrdersToolbarProps = Omit<ComponentProps<"div">, "children"> & {
  /** Поточні сортування й період з адреси. */
  choice: OrdersListChoice;
  /** Шлях сторінки зі списком. */
  basePath?: string;
};

type Option = { value: string; label: string };

function ChoiceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      {/* На телефоні списки ділять рядок порівну, а на зовсім вузькому стають один під одним. */}
      <SelectTrigger
        aria-label={label}
        className="w-full min-w-0 font-semibold sm:w-auto sm:min-w-44"
      >
        {/* Текст передаємо самі: без нього Radix показує порожню кнопку до гідратації. */}
        <SelectValue>{options.find((option) => option.value === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Період і сортування списку замовлень на shadcn Select. Вибір одразу змінює адресу —
 * список починається з першої сторінки, а прокрутка лишається на місці.
 */
export function OrdersToolbar({
  choice,
  basePath = "/account",
  className,
  ...props
}: OrdersToolbarProps) {
  const navigate = useNavigate();
  const go = (next: OrdersListChoice) =>
    void navigate(`${basePath}${ordersListSearch(next)}`, { preventScrollReset: true });

  return (
    <div
      role="group"
      aria-label="Період і сортування замовлень"
      data-slot="orders-toolbar"
      className={cn("grid min-w-0 grid-cols-1 gap-2 min-[26rem]:grid-cols-2 sm:flex", className)}
      {...props}
    >
      <ChoiceSelect
        label="Період"
        value={choice.period}
        options={ORDER_PERIODS}
        onChange={(period) => go({ ...choice, period })}
      />
      <ChoiceSelect
        label="Сортування"
        value={choice.sort}
        options={ORDER_SORTS}
        onChange={(sort) => go({ ...choice, sort })}
      />
    </div>
  );
}
