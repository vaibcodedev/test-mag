import {
  PredictiveSearchProvider,
  usePredictiveSearch,
  usePredictiveSearchActions,
  usePredictiveSearchForm,
  type PredictiveSearchProviderProps,
} from "@shopify/hydrogen/react";
import { Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { Command } from "~/components/ui/command";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover";
import { describeSuggestions, PREDICTIVE_SEARCH_TYPES } from "~/lib/predictive-search";

import { hasPredictiveOptions, PredictiveList } from "./predictive-list";
import {
  buildPredictiveOptions,
  SEARCH_PAGE_PATH,
  searchPageUrl,
  type PredictiveOption,
} from "./predictive-options";

/** Скільки підказок кожного типу просимо в Storefront API. */
const PREDICTIVE_LIMIT = 4;
const PREDICTIVE_TYPES = [...PREDICTIVE_SEARCH_TYPES];
/**
 * Значення cmdk, якого немає серед підказок: «нічого не вибрано». З порожнім значенням cmdk
 * сам підсвічує перший рядок, і тоді Enter відкривав би підказку замість сторінки результатів.
 */
const NO_ACTIVE = "-";

export type PredictiveSearchProps = {
  className?: string;
  /** Класи самого поля: у шапці воно сіре на білому, на сторінці пошуку — біле на сірому. */
  fieldClassName?: string;
  /** Запит, з яким відкрили сторінку пошуку. */
  defaultTerm?: string;
  placeholder?: string;
  /** Підпис поля для екранних читачів. */
  label?: string;
  /**
   * Фокус у полі одразу після відкриття сторінки. Лише для /search без запиту: туди веде
   * іконка пошуку на мобільному, і поле — єдине, заради чого сторінку відкрили.
   */
  initialFocus?: boolean;
  /**
   * Видимі кнопки в полі: «Шукати» і, коли є текст, «Очистити запит». Для сторінки /search,
   * де поле — головний елемент; у шапці досить Enter і лупи-прикраси.
   */
  actions?: boolean;
} & Pick<PredictiveSearchProviderProps, "fetch" | "debounceInMs">;

/**
 * Поле пошуку з підказками. Без JavaScript це звичайна GET-форма на /search?q=…;
 * після гідратації під полем з'являється список із запитами, товарами та категоріями.
 *
 * Список — shadcn Command (cmdk) у Popover, прив'язаному до поля. cmdk веде вибір стрілками
 * та мишею і розмітку listbox/option; фільтрацію вимкнено, бо підказки вже відібрав магазин.
 * Поле лишається нашим <input type="search" name="q"> з register("query") Hydrogen:
 * CommandInput нав'язує type="text", власне значення й aria-expanded="true" назавжди.
 */
export function PredictiveSearch({ fetch, debounceInMs, ...props }: PredictiveSearchProps) {
  return (
    <PredictiveSearchProvider
      searchAction={SEARCH_PAGE_PATH}
      limit={PREDICTIVE_LIMIT}
      types={PREDICTIVE_TYPES}
      fetch={fetch}
      debounceInMs={debounceInMs}
    >
      <PredictiveSearchField {...props} />
    </PredictiveSearchProvider>
  );
}

function PredictiveSearchField({
  className,
  fieldClassName,
  defaultTerm = "",
  placeholder = "Шукати iPhone, MacBook, AirPods",
  label = "Пошук товарів",
  initialFocus = false,
  actions = false,
}: Omit<PredictiveSearchProps, "fetch" | "debounceInMs">) {
  const state = usePredictiveSearch();
  const { clear } = usePredictiveSearchActions();
  const { formProps, register } = usePredictiveSearchForm();
  const navigate = useNavigate();
  const idPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Елемент listbox: cmdk сам дає йому id, поле посилається на нього через aria-controls. */
  const [list, setList] = useState<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Поле некероване, тому наявність тексту для кнопки «Очистити» відстежуємо окремо. */
  const [hasText, setHasText] = useState(defaultTerm.length > 0);

  // Нові підказки — нові рядки під тими самими id: клавіатурний вибір починається спочатку.
  const [seenResult, setSeenResult] = useState(state.result);
  if (seenResult !== state.result) {
    setSeenResult(state.result);
    setActiveId(null);
  }

  const options = useMemo(
    () =>
      buildPredictiveOptions(state.result.items, {
        idPrefix,
        resultTerm: state.result.term,
        typedTerm: state.term,
      }),
    [state.result, state.term, idPrefix],
  );

  const visible = open && state.status !== "idle" && state.term.length > 0;
  const hasOptions = hasPredictiveOptions(state.status, options);
  const expanded = visible && hasOptions;
  const activeOption = expanded ? options.flat.find((option) => option.id === activeId) : undefined;

  const close = () => {
    setOpen(false);
    setActiveId(null);
  };

  /** Закриває список і скидає стор, щоб застарілі підказки не з'явилися знову. */
  const finish = () => {
    close();
    clear();
  };

  const select = (option: PredictiveOption) => {
    if (option.kind === "query" && inputRef.current) {
      inputRef.current.value = option.title;
      setHasText(true);
    }
    finish();
  };

  const clearField = () => {
    if (inputRef.current) inputRef.current.value = "";
    setHasText(false);
    finish();
    inputRef.current?.focus();
  };

  // Стрілки у відкритому списку спливають до Command: вибір по колу веде cmdk.
  // Решту зупиняємо тут, бо cmdk забрав би в поля Enter (відправку форми), Home та End.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (!hasOptions) {
          event.stopPropagation();
          return;
        }
        if (!visible) {
          // Список закрили клавішею Escape: стрілка відкриває його одразу з вибраним рядком.
          event.preventDefault();
          event.stopPropagation();
          const { flat } = options;
          setOpen(true);
          setActiveId((event.key === "ArrowDown" ? flat[0] : flat[flat.length - 1])?.id ?? null);
        }
        return;
      }
      case "Enter": {
        event.stopPropagation();
        // Без вибраної підказки Enter відправляє форму: відкриється повна сторінка результатів.
        if (!activeOption) return;
        event.preventDefault();
        select(activeOption);
        void navigate(activeOption.href, { viewTransition: true });
        return;
      }
      case "Escape": {
        if (!visible) return;
        // Chromium першим Escape очищає поле type="search": спершу лише закриваємо список.
        event.preventDefault();
        close();
        return;
      }
      case "Home":
      case "End": {
        // У полі ці клавіші рухають курсор, а не вибір у списку.
        event.stopPropagation();
        return;
      }
    }
  };

  return (
    <Popover
      open={visible}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Command
        ref={rootRef}
        data-slot="predictive-search"
        shouldFilter={false}
        vimBindings={false}
        loop
        value={activeOption?.id ?? NO_ACTIVE}
        onValueChange={(value) => setActiveId(value && value !== NO_ACTIVE ? value : null)}
        // Command тут — обгортка довкола поля, а не панель.
        unstyled
        className={className}
      >
        <PopoverAnchor asChild>
          <form
            {...formProps({
              onSubmit: (event, term) => {
                event.preventDefault();
                const trimmed = term.trim();
                finish();
                inputRef.current?.blur();
                void navigate(trimmed ? searchPageUrl(trimmed) : SEARCH_PAGE_PATH, {
                  viewTransition: true,
                });
              },
            })}
          >
            <InputGroup className={fieldClassName}>
              {/* З кнопкою «Шукати» лупа-прикраса зайва: іконка вже є на кнопці. */}
              {actions ? null : (
                <InputGroupAddon>
                  <Search aria-hidden="true" strokeWidth={2} />
                </InputGroupAddon>
              )}
              <InputGroupInput
                ref={inputRef}
                {...register("query", {
                  defaultValue: defaultTerm,
                  placeholder,
                  enterKeyHint: "search",
                  autoFocus: initialFocus,
                  role: "combobox",
                  "aria-label": label,
                  "aria-autocomplete": "list",
                  "aria-haspopup": "listbox",
                  "aria-expanded": expanded,
                  "aria-controls": expanded ? list?.id : undefined,
                  "aria-activedescendant": activeOption?.id,
                  onChange: (event) => {
                    setOpen(true);
                    setActiveId(null);
                    setHasText(event.currentTarget.value.length > 0);
                  },
                  onFocus: () => setOpen(true),
                  onKeyDown: handleKeyDown,
                })}
                // Своя кнопка «Очистити» замість хрестика, який Chromium малює в type="search".
                className={
                  actions ? "ps-4 [&::-webkit-search-cancel-button]:appearance-none" : undefined
                }
              />
              {/* Після поля в DOM: Tab іде поле → «Очистити» → «Шукати». */}
              {actions ? (
                <InputGroupAddon align="end" className="gap-1">
                  {hasText ? (
                    <Button type="button" variant="ghost" size="icon" onClick={clearField}>
                      <X aria-hidden="true" strokeWidth={2} />
                      <span className="sr-only">Очистити запит</span>
                    </Button>
                  ) : null}
                  <Button type="submit" size="icon">
                    <Search aria-hidden="true" strokeWidth={2} />
                    <span className="sr-only">Шукати</span>
                  </Button>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          </form>
        </PopoverAnchor>

        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {describeSuggestions(state)}
        </p>

        <PopoverContent
          // Це не діалог, а шар зі списком підказок: роль і назву має сам listbox.
          role="presentation"
          align="start"
          avoidCollisions={false}
          // Фокус лишається в полі і під час відкриття, і після закриття.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          // Клік чи фокус у самому полі — не «поза шаром»: список має лишатися відкритим.
          onInteractOutside={(event) => {
            if (event.target instanceof Node && rootRef.current?.contains(event.target)) {
              event.preventDefault();
            }
          }}
          className="w-(--radix-popover-trigger-width) gap-0 p-1.5"
        >
          <PredictiveList
            listRef={setList}
            status={state.status}
            options={options}
            onSelect={select}
          />
        </PopoverContent>
      </Command>
    </Popover>
  );
}
