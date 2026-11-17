import { formatMoney, parseCollectionParams, type ProductFilter } from "@shopify/hydrogen";
import { useEffect, useRef, useState, type ChangeEvent, type Ref } from "react";

import { Field } from "~/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { Slider } from "~/components/ui/slider";
import { formatInteger, LOCALE } from "~/lib/format";
import { activePrice, PRICE_MAX_PARAM, PRICE_MIN_PARAM, priceStep } from "~/lib/shopify/collection";

/** Пауза після останнього символу, перш ніж форма відправиться сама. */
const TYPING_DELAY_MS = 350;

type Range = [min: number, max: number];

type FilterPriceProps = {
  activeFilters: ProductFilter[];
  /** Валюта товарів із того самого запиту, що й ціни. */
  currencyCode: string;
  /** Найвища ціна в колекції; 0 — невідома, тоді повзунка немає. */
  ceiling: number;
  labelId: string;
};

function readNumber(input: HTMLInputElement | null, fallback: number): number {
  if (!input || input.value === "") return fallback;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Фільтр ціни: повзунок і два числові поля з тими самими значеннями.
 * Без JavaScript працюють поля (звичайна GET-форма); повзунок лише дублює їх.
 * Поля некеровані: зовнішні зміни (чип, «назад») записуються в них через ref,
 * щоб не затирати те, що покупець саме вводить.
 */
export function FilterPrice({ activeFilters, currencyCode, ceiling, labelId }: FilterPriceProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minInput = useRef<HTMLInputElement>(null);
  const maxInput = useRef<HTMLInputElement>(null);
  /** Значення повзунка, поки покупець тягне його або вводить число й форма ще не відправлена. */
  const [draft, setDraft] = useState<Range | null>(null);

  const price = activePrice(activeFilters);
  const min = price?.min ?? "";
  const max = price?.max ?? "";
  const top = Math.max(ceiling, Number(min) || 0, Number(max) || 0);
  const step = priceStep(top);
  const symbol = formatMoney(
    { amount: "0", currencyCode },
    { locale: LOCALE },
  ).currencyNarrowSymbol;

  const clamp = (value: number) => Math.min(Math.max(value, 0), top);
  const range: Range = draft ?? [clamp(Number(min) || 0), clamp(max === "" ? top : max)];

  function cancelPendingSubmit() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  useEffect(() => {
    for (const [input, value] of [
      [minInput.current, min],
      [maxInput.current, max],
    ] as const) {
      if (!input) continue;
      const matches =
        value === "" ? input.value === "" : input.value !== "" && Number(input.value) === value;
      if (!matches) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        input.value = String(value);
      }
    }
  }, [min, max]);

  useEffect(() => {
    function settle() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setDraft(null);
    }

    function restoreHistoryPrice() {
      // Чернетку скасовуємо ще до того, як завантажаться дані з історії.
      settle();
      const { filters } = parseCollectionParams(new URLSearchParams(window.location.search));
      const restored = activePrice(filters);
      if (minInput.current) minInput.current.value = String(restored?.min ?? "");
      if (maxInput.current) maxInput.current.value = String(restored?.max ?? "");
    }

    // Будь-яка відправка форми (зокрема Enter) уже несе введену ціну.
    const form = minInput.current?.form;
    form?.addEventListener("submit", settle);
    window.addEventListener("popstate", restoreHistoryPrice);
    return () => {
      form?.removeEventListener("submit", settle);
      window.removeEventListener("popstate", restoreHistoryPrice);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  function submitAfterTyping(event: ChangeEvent<HTMLInputElement>) {
    cancelPendingSubmit();
    const low = clamp(readNumber(minInput.current, 0));
    const high = clamp(readNumber(maxInput.current, top));
    setDraft([Math.min(low, high), Math.max(low, high)]);

    const form = event.currentTarget.form;
    timer.current = setTimeout(() => {
      timer.current = null;
      form?.requestSubmit();
    }, TYPING_DELAY_MS);
  }

  function slide(next: number[]) {
    const [low = 0, high = top] = next;
    setDraft([low, high]);
    // Крайні положення означають «без межі»: порожнє поле не потрапляє в адресу як фільтр.
    if (minInput.current) minInput.current.value = low <= 0 ? "" : String(low);
    if (maxInput.current) maxInput.current.value = high >= top ? "" : String(high);
  }

  function commitSlide() {
    cancelPendingSubmit();
    minInput.current?.form?.requestSubmit();
  }

  return (
    <div
      data-slot="filter-price"
      role="group"
      aria-labelledby={labelId}
      className="flex min-w-0 flex-col gap-1"
    >
      {top > 0 ? (
        <Slider
          value={range}
          min={0}
          max={top}
          step={step}
          minStepsBetweenThumbs={1}
          thumbLabels={["Ціна від", "Ціна до"]}
          onValueChange={slide}
          onValueCommit={commitSlide}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <PriceInput
          inputRef={minInput}
          name={PRICE_MIN_PARAM}
          defaultValue={min}
          label={`Мінімальна ціна, ${currencyCode}`}
          placeholder="0"
          symbol={symbol}
          onChange={submitAfterTyping}
        />
        <PriceInput
          inputRef={maxInput}
          name={PRICE_MAX_PARAM}
          defaultValue={max}
          label={`Максимальна ціна, ${currencyCode}`}
          // Лише число: «до 200 000» у вузьке поле бічної панелі не вміщається.
          placeholder={top > 0 ? formatInteger(top) : ""}
          symbol={symbol}
          onChange={submitAfterTyping}
        />
      </div>
    </div>
  );
}

type PriceInputProps = {
  inputRef: Ref<HTMLInputElement>;
  name: string;
  defaultValue: number | "";
  /** Назва для читачів екрана: з межею та кодом валюти. */
  label: string;
  placeholder: string;
  /** Знак валюти стоїть поза полем: в адресу потрапляє лише число. */
  symbol: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function PriceInput({
  inputRef,
  name,
  defaultValue,
  label,
  placeholder,
  symbol,
  onChange,
}: PriceInputProps) {
  return (
    <Field>
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          aria-label={label}
          type="number"
          inputMode="decimal"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          min="0"
          step="any"
          onChange={onChange}
          className="ps-2.5 pe-0 tabular-nums lg:text-small"
        />
        <InputGroupAddon align="end" aria-hidden="true" className="ps-1 pe-2.5">
          {symbol}
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
