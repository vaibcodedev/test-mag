import type { ProductFilter } from "@shopify/hydrogen";
import { useId, useRef, useState, type ChangeEvent } from "react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "~/components/ui/field";
import { isExclusiveFilter, type CollectionFilter } from "~/lib/shopify/collection";
import { cn } from "~/lib/utils";

import { filterOptions, uncheckSiblings, type FilterOption } from "./filter-options";

type FilterCheckboxListProps = {
  filter: CollectionFilter;
  activeFilters: ProductFilter[];
  /** id назви групи для aria-labelledby. */
  labelId: string;
};

/**
 * Один прапорець фільтра. Radix Checkbox тримає у формі приховане поле з тими самими
 * name і value, тож GET-форма збирає ту саму адресу, що й нативний прапорець.
 */
function FilterCheckbox({ filter, option }: { filter: CollectionFilter; option: FilterOption }) {
  const { value, name, param, checked, countLabel } = option;
  const id = useId();
  /** Стан прапорця до відповіді сервера; адреса (чип, «назад») оновлює його на місці. */
  const [on, setOn] = useState(checked);
  const [seenChecked, setSeenChecked] = useState(checked);
  if (seenChecked !== checked) {
    setSeenChecked(checked);
    setOn(checked);
  }
  /** Зміну зробив покупець, а не адреса: лише тоді форму треба відправити. */
  const changedByShopper = useRef(false);

  // Radix оновлює приховане поле після рендера й сповіщає про це подією change:
  // у цю мить форма вже містить нове значення, тож її можна відправляти.
  function submitWhenFormIsReady(event: ChangeEvent<HTMLDivElement>) {
    if (!changedByShopper.current) return;
    changedByShopper.current = false;
    const input: Element = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.checked && isExclusiveFilter(filter, name)) uncheckSiblings(input);
    input.form?.requestSubmit();
  }

  return (
    <Field orientation="horizontal" data-slot="filter-option" onChange={submitWhenFormIsReady}>
      <Checkbox
        id={id}
        name={name}
        value={param}
        checked={on}
        onCheckedChange={(next) => {
          changedByShopper.current = true;
          setOn(next === true);
        }}
      />
      <FieldLabel
        htmlFor={id}
        className={cn(
          "min-h-11 cursor-pointer text-body font-normal",
          value.count > 0 || on ? "text-ink" : "text-muted-foreground",
        )}
      >
        <span className="min-w-0 flex-1 wrap-anywhere">{value.label}</span>
        <span aria-hidden="true" className="text-small text-muted-foreground tabular-nums">
          {value.count}
        </span>
        <span className="sr-only">, {countLabel}</span>
      </FieldLabel>
    </Field>
  );
}

/** Скільки значень видно одразу; решта ховається за «Показати ще». */
export const VISIBLE_OPTIONS = 6;

/**
 * Група прапорців: пам'ять, стан, наявність. Довгий список (кольори) показує перші шість
 * значень і всі ввімкнені: вибране не має ховатися за кнопкою.
 */
export function FilterCheckboxList({ filter, activeFilters, labelId }: FilterCheckboxListProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const options = filterOptions(filter, activeFilters);
  if (options.length === 0) return null;

  // Одне-два зайві значення не варті кнопки: вона сама займає рядок.
  const collapsible = options.length > VISIBLE_OPTIONS + 2;
  // Завжди на видноті: перші шість і всі ввімкнені. Решта — у блоці, що розгортається.
  const pinned = collapsible
    ? options.filter((option, index) => index < VISIBLE_OPTIONS || option.checked)
    : options;
  const rest = collapsible ? options.filter((option) => !pinned.includes(option)) : [];
  const hidden = rest.length;

  return (
    <FieldSet aria-labelledby={labelId}>
      <FieldGroup data-slot="checkbox-group">
        {pinned.map((option) => (
          <FilterCheckbox key={option.value.id} filter={filter} option={option} />
        ))}
      </FieldGroup>
      {hidden > 0 ? (
        // Висоту веде сітка (рядок 0fr ↔ 1fr), як в акордеоні: значення розгортаються плавно.
        // Згорнуті — невидимі й приховані від читачів екрана, тож у фокус не потрапляють.
        <div
          id={listId}
          data-slot="filter-more"
          data-state={expanded ? "open" : "closed"}
          aria-hidden={expanded ? undefined : true}
          className="grid transition-[grid-template-rows,visibility] duration-300 ease-in-out data-[state=closed]:invisible data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]"
        >
          <div className="-m-1 min-h-0 overflow-hidden p-1">
            <FieldGroup data-slot="checkbox-group">
              {rest.map((option) => (
                <FilterCheckbox key={option.value.id} filter={filter} option={option} />
              ))}
            </FieldGroup>
          </div>
        </div>
      ) : null}
      {hidden > 0 ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((current) => !current)}
          className="min-h-11 w-fit"
        >
          {expanded ? "Згорнути" : `Показати ще ${hidden}`}
        </Button>
      ) : null}
    </FieldSet>
  );
}
