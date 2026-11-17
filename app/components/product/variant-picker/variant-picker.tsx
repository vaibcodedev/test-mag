import type { ComponentProps, KeyboardEvent, MouseEvent } from "react";
import { Link } from "react-router";

import { FieldDescription, FieldLegend, FieldSet } from "~/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/lib/utils";

export type VariantPickerValue = {
  /** Значення опції: «256 ГБ», «Синій титан». */
  name: string;
  selected: boolean;
  /** false — такої комбінації з уже вибраними опціями не існує. */
  exists: boolean;
  /** false — комбінація існує, але її немає в наявності. */
  available: boolean;
  /** Адреса товару з цим значенням: працює і без JavaScript. */
  to: string;
  /** Hex-колір для кружечка. Без нього значення показується пігулкою. */
  swatch?: string | null;
  /**
   * Вибір у межах того самого товару (register("optionValue").onClick із форми Hydrogen).
   * Без нього посилання веде на інший товар об'єднаного списку.
   */
  onSelect?: () => void;
};

export type VariantPickerOption = {
  /** Назва опції: «Пам'ять», «Колір». */
  name: string;
  values: readonly VariantPickerValue[];
};

export type VariantPickerProps = Omit<ComponentProps<"div">, "children"> & {
  options: readonly VariantPickerOption[];
};

/**
 * Звичайний клік лівою кнопкою без модифікаторів. Решту (Ctrl/Cmd-клік, середня кнопка)
 * лишаємо браузеру: посилання відкриється в новій вкладці, а вибір на сторінці не зміниться.
 */
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    (!event.currentTarget.target || event.currentTarget.target === "_self")
  );
}

/** Пробіл вибирає радіокнопку; у посилання цю клавішу браузер сам не обробляє. */
function activateOnSpace(event: KeyboardEvent<HTMLAnchorElement>) {
  if (event.key !== " ") return;
  event.preventDefault();
  event.currentTarget.click();
}

function PickerValue({ value }: { value: VariantPickerValue }) {
  const swatch = value.swatch ?? undefined;
  const soldOut = value.exists && !value.available;

  // Комбінації не існує: справжня вимкнена кнопка, адреси для неї немає.
  if (!value.exists) {
    return (
      <ToggleGroupItem
        value={value.name}
        disabled
        variant={swatch ? "swatch" : "pill"}
        swatch={swatch}
        unavailable
        aria-label={`${value.name}: такої комбінації немає`}
        title="Такої комбінації немає"
      >
        {swatch ? null : value.name}
      </ToggleGroupItem>
    );
  }

  const { onSelect } = value;
  const variant = swatch ? "swatch" : "pill";

  return (
    // Стан «немає в наявності» (закреслення, приглушена крапка) дає база за data-available.
    <ToggleGroupItem
      asChild
      value={value.name}
      variant={variant}
      swatch={swatch}
      data-available={value.available}
    >
      {/* Посилання лишається посиланням: адреса варіанта працює без JavaScript і в новій вкладці. */}
      <Link
        viewTransition
        to={value.to}
        replace={Boolean(onSelect)}
        preventScrollReset
        // Radix передає кнопці type="button"; посиланню цей атрибут не потрібен.
        type={undefined}
        aria-label={swatch ? `${value.name}${soldOut ? ", немає в наявності" : ""}` : undefined}
        title={swatch ? value.name : undefined}
        onKeyDown={activateOnSpace}
        onClick={
          onSelect
            ? (event) => {
                if (!isPlainClick(event)) return;
                // Адресу оновлює ProductProvider (onSelect); другий перехід Link тут зайвий.
                event.preventDefault();
                onSelect();
              }
            : undefined
        }
      >
        {swatch ? null : (
          <>
            {value.name}
            {soldOut ? <span className="sr-only">, немає в наявності</span> : null}
          </>
        )}
      </Link>
    </ToggleGroupItem>
  );
}

/** Пояснення під опцією: чому частина значень закреслена чи вимкнена. */
function OptionHint({ option }: { option: VariantPickerOption }) {
  const soldOut = option.values.filter((value) => value.exists && !value.available);
  const missing = option.values.filter((value) => !value.exists);
  if (soldOut.length === 0 && missing.length === 0) return null;

  const names = (values: VariantPickerValue[]) => values.map((value) => value.name).join(", ");

  return (
    <FieldDescription>
      {soldOut.length > 0 ? `Немає в наявності: ${names(soldOut)}. ` : null}
      {missing.length > 0 ? `Немає такої комбінації з вибраними опціями: ${names(missing)}.` : null}
    </FieldDescription>
  );
}

/**
 * Вибір варіанта товару. Кожна опція — група перемикачів, а кожне значення в ній — посилання
 * на адресу з цим варіантом, тож вибором можна поділитися і він працює без JavaScript.
 * Якщо вибирати нічого, блок не показується.
 */
export function VariantPicker({ options, className, ...props }: VariantPickerProps) {
  if (options.every((option) => option.values.length <= 1)) return null;

  return (
    <div data-slot="variant-picker" className={cn("flex flex-col gap-4", className)} {...props}>
      {options.map((option) => {
        const selected = option.values.find((value) => value.selected);
        const hasSwatches = option.values.some((value) => value.swatch);

        return (
          <FieldSet key={option.name} className="gap-2">
            <FieldLegend variant="label" className="font-normal text-ink-2">
              {option.name}
              {selected ? (
                <>
                  : <span className="font-semibold text-ink">{selected.name}</span>
                </>
              ) : null}
            </FieldLegend>
            {/*
              Вибране значення задає адреса сторінки, тому група керована, а onValueChange
              порожній: перехід робить саме посилання. rovingFocus вимкнено, щоб кожне
              посилання лишалося досяжним клавішею Tab — і без JavaScript теж.
            */}
            <ToggleGroup
              type="single"
              variant={hasSwatches ? "swatch" : "pill"}
              rovingFocus={false}
              aria-label={option.name}
              value={selected?.name ?? ""}
            >
              {option.values.map((value) => (
                <PickerValue key={value.name} value={value} />
              ))}
            </ToggleGroup>
            <OptionHint option={option} />
          </FieldSet>
        );
      })}
    </div>
  );
}
