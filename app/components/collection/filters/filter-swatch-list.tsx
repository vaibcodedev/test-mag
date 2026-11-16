import type { ProductFilter } from "@shopify/hydrogen";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { ShopImage } from "~/components/ui/shop-image";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  isExclusiveFilter,
  swatchColor,
  swatchImage,
  type CollectionFilter,
} from "~/lib/shopify/collection";
import { cn } from "~/lib/utils";

import { filterOptions } from "./filter-options";

const SWATCH_IMAGE_SIZE = 48;
const KEY_SEPARATOR = "|";

type FilterSwatchListProps = {
  filter: CollectionFilter;
  activeFilters: ProductFilter[];
  labelId: string;
};

/**
 * Група кольорів: перемикачі зі зразком і назвою поруч, щоб колір не був єдиною ознакою.
 * Перемикачі самі у форму не потрапляють, тому кожне ввімкнене значення дублює приховане
 * поле з name і value з FilterValue.input — GET-форма збирає ту саму адресу, що й прапорці.
 */
export function FilterSwatchList({ filter, activeFilters, labelId }: FilterSwatchListProps) {
  const options = filterOptions(filter, activeFilters);
  const active = options.filter((option) => option.checked).map((option) => option.value.id);
  const activeKey = active.join(KEY_SEPARATOR);
  const root = useRef<HTMLDivElement>(null);
  /** Вибір до відповіді сервера; адреса (чип, «назад») оновлює його на місці. */
  const [pressed, setPressed] = useState<readonly string[]>(active);
  const [seenKey, setSeenKey] = useState(activeKey);
  if (seenKey !== activeKey) {
    setSeenKey(activeKey);
    setPressed(active);
  }

  if (options.length === 0) return null;

  function change(next: string[]) {
    const added = options.find(
      ({ value }) => next.includes(value.id) && !pressed.includes(value.id),
    );
    // «Так» і «ні» одного BOOLEAN-фільтра разом не вмикаються: нове значення знімає попереднє.
    const kept =
      added && isExclusiveFilter(filter, added.name)
        ? next.filter(
            (id) =>
              id === added.value.id ||
              options.find(({ value }) => value.id === id)?.name !== added.name,
          )
        : next;

    // Приховані поля мають оновитися до відправки: форма читає їх одразу.
    flushSync(() => setPressed(kept));
    root.current?.closest("form")?.requestSubmit();
  }

  return (
    <div ref={root} data-slot="filter-swatches">
      {options.map(({ value, name, param }) =>
        pressed.includes(value.id) ? (
          <input key={value.id} type="hidden" name={name} value={param} />
        ) : null,
      )}
      <ToggleGroup
        type="multiple"
        variant="pill"
        role="group"
        aria-labelledby={labelId}
        value={[...pressed]}
        onValueChange={change}
        className="pt-1"
      >
        {options.map(({ value, countLabel }) => {
          const image = swatchImage(value);
          const on = pressed.includes(value.id);

          return (
            <ToggleGroupItem
              key={value.id}
              value={value.id}
              // Колір зразка — дані товару з магазину, а не колір інтерфейсу.
              swatch={image ? undefined : (swatchColor(value) ?? undefined)}
              data-slot="filter-swatch"
              className={cn("ps-2", value.count === 0 && !on && "text-muted-foreground")}
            >
              {image ? (
                <span
                  aria-hidden="true"
                  className="relative size-7 shrink-0 overflow-hidden rounded-pill border border-line"
                >
                  <ShopImage
                    src={image.url}
                    alt=""
                    width={SWATCH_IMAGE_SIZE}
                    height={SWATCH_IMAGE_SIZE}
                    sizes="28px"
                    widths={[SWATCH_IMAGE_SIZE, SWATCH_IMAGE_SIZE * 2]}
                    className="absolute inset-0 size-full object-cover"
                  />
                </span>
              ) : null}
              <span>{value.label}</span>
              <span className="sr-only">, {countLabel}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
