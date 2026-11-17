import {
  getFilterRemovalUrl,
  getSortByValue,
  isFilterInputActive,
  parseCollectionParams,
  serializeCollectionParams,
  type CollectionState,
  type ProductFilter,
} from "@shopify/hydrogen";

import { formatInteger, formatPrice, plural } from "~/lib/format";

/**
 * Чисті хелпери каталогу: адреса ⇄ фільтри, сортування, пагінація, підписи.
 * Тут немає GraphQL-документів, тому файл безпечно імпортувати в компоненти.
 * Запити до Storefront API живуть у load-collection.ts.
 */

/** 24 ділиться на 2, 3 і 4 колонки сітки без неповного рядка. */
export const COLLECTION_PAGE_SIZE = 24;
/** Скільки товарів рахуємо для «Показано N із M». Якщо їх більше — загальна кількість невідома. */
export const COLLECTION_COUNT_LIMIT = 250;

export const PRICE_MIN_PARAM = "filter.v.price.gte";
export const PRICE_MAX_PARAM = "filter.v.price.lte";
export const SORT_PARAM = "sort_by";
export const AFTER_PARAM = "after";
export const BEFORE_PARAM = "before";

const FILTER_PARAM_PREFIX = "filter.";
const FALLBACK_PRICE_FILTER_ID = "filter.v.price";

/* ── Типи ─────────────────────────────────────────────────────────────── */

export type CollectionFilterValue = {
  id: string;
  label: string;
  count: number;
  /** JSON-рядок ProductFilter зі Storefront API: єдине джерело назви й значення параметра. */
  input: string;
  swatch?: {
    color?: string | null;
    image?: { previewImage?: { url: string; altText?: string | null } | null } | null;
  } | null;
};

export type CollectionFilter = {
  id: string;
  label: string;
  /** LIST, BOOLEAN або PRICE_RANGE. */
  type: string;
  /** TEXT, SWATCH або IMAGE; лише для LIST. */
  presentation?: string | null;
  values: CollectionFilterValue[];
};

export type CollectionPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};

export type BrowseSort = Pick<CollectionState, "sortKey" | "reverse">;
export type BrowseState = Pick<CollectionState, "filters" | "sortKey" | "reverse">;

/* ── Сортування ───────────────────────────────────────────────────────── */

export type SortOption = { label: string; value: string };

/** Значення за замовчуванням: Hydrogen не пише його в адресу, тож вона лишається чистою. */
export const DEFAULT_SORT_VALUE = getSortByValue("COLLECTION_DEFAULT", false);

export const SORT_OPTIONS: readonly SortOption[] = [
  { label: "Спочатку популярні", value: DEFAULT_SORT_VALUE },
  { label: "Спочатку дешевші", value: getSortByValue("PRICE", false) },
  { label: "Спочатку дорожчі", value: getSortByValue("PRICE", true) },
  { label: "Спочатку новинки", value: getSortByValue("CREATED", true) },
];

/**
 * Сортування з адреси → змінні запиту. Без параметра — порядок, заданий для колекції в адмінці
 * (COLLECTION_DEFAULT): власник сам вирішує, що йде першим. BEST_SELLING у магазині без продажів
 * дає випадковий порядок.
 */
export function toStorefrontSort({ sortKey, reverse }: BrowseSort): {
  sortKey: NonNullable<BrowseSort["sortKey"]>;
  reverse: boolean;
} {
  if (!sortKey) return { sortKey: "COLLECTION_DEFAULT", reverse: false };
  return { sortKey, reverse };
}

/** Значення для <select>: «популярні» і є сортуванням за замовчуванням. */
export function sortSelectValue({ sortKey, reverse }: BrowseSort): string {
  if (!sortKey || sortKey === "BEST_SELLING") return DEFAULT_SORT_VALUE;
  return getSortByValue(sortKey, reverse);
}

/* ── Пагінація ────────────────────────────────────────────────────────── */

export type PageArgs = {
  first?: number;
  last?: number;
  after?: string;
  before?: string;
};

/** ?after= веде вперед, ?before= назад; без курсора — перша сторінка. */
export function parsePageArgs(
  searchParams: URLSearchParams,
  pageSize: number = COLLECTION_PAGE_SIZE,
): PageArgs {
  const after = searchParams.get(AFTER_PARAM);
  if (after) return { first: pageSize, after };

  const before = searchParams.get(BEFORE_PARAM);
  if (before) return { last: pageSize, before };

  return { first: pageSize };
}

/** Адреса сусідньої сторінки: фільтри й сортування лишаються, курсор замінюється. */
export function pageHref(
  pathname: string,
  search: string,
  cursor: { after: string } | { before: string },
): string {
  const params = new URLSearchParams(search);
  params.delete(AFTER_PARAM);
  params.delete(BEFORE_PARAM);
  if ("after" in cursor) params.set(AFTER_PARAM, cursor.after);
  else params.set(BEFORE_PARAM, cursor.before);
  return `${pathname}?${params.toString()}`;
}

/** Посилання на сусідні сторінки списку; працюють і без JavaScript. */
export type PageHrefs = {
  previousHref: string | null;
  nextHref: string | null;
};

/** Адреси попередньої й наступної сторінок за курсорами з pageInfo; null — сторінки немає. */
export function pageHrefs(
  pathname: string,
  search: string,
  pageInfo: CollectionPageInfo,
): PageHrefs {
  return {
    previousHref:
      pageInfo.hasPreviousPage && pageInfo.startCursor
        ? pageHref(pathname, search, { before: pageInfo.startCursor })
        : null,
    nextHref:
      pageInfo.hasNextPage && pageInfo.endCursor
        ? pageHref(pathname, search, { after: pageInfo.endCursor })
        : null,
  };
}

/* ── Адреси ───────────────────────────────────────────────────────────── */

export function collectionPath(handle: string): string {
  return `/collections/${handle}`;
}

function withSearch(pathname: string, params: URLSearchParams): string {
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * Чи можна індексувати адресу: лише чиста сторінка колекції.
 * Фільтр, сортування чи курсор пагінації дають noindex і canonical на чисту адресу.
 */
export function isIndexable(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (key.startsWith(FILTER_PARAM_PREFIX)) return false;
    if (key === SORT_PARAM || key === AFTER_PARAM || key === BEFORE_PARAM) return false;
  }
  return true;
}

/* ── SEO ──────────────────────────────────────────────────────────────── */

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;

/** Обрізає текст по межі слова й додає «…». */
export function truncateText(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;

  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/**
 * <title> до 60 символів і description близько 150.
 * Спершу беруться SEO-поля колекції з адмінки, далі — назва й опис.
 */
export function collectionSeo(
  collection: {
    title: string;
    description?: string | null;
    seo?: { title?: string | null; description?: string | null } | null;
  },
  storeName: string,
): { title: string; description: string } {
  const name = collection.seo?.title?.trim() || collection.title;
  const full = `${name} — купити у Вінниці | ${storeName}`;
  const short = `${name} — ${storeName}`;
  const title =
    full.length <= TITLE_LIMIT
      ? full
      : short.length <= TITLE_LIMIT
        ? short
        : truncateText(name, TITLE_LIMIT);

  const description =
    collection.seo?.description?.trim() ||
    collection.description?.trim() ||
    `${collection.title} у магазині «${storeName}»: актуальні ціни, оплата частинами до 25 платежів, гарантія 12 місяців і доставка по Україні завтра.`;

  return { title, description: truncateText(description, DESCRIPTION_LIMIT) };
}

/* ── Фільтри ──────────────────────────────────────────────────────────── */

function parseFilterInput(input: string): ProductFilter | null {
  try {
    const parsed: unknown = JSON.parse(input);
    return parsed && typeof parsed === "object" ? (parsed as ProductFilter) : null;
  } catch {
    return null;
  }
}

/**
 * FilterValue.input → назва й значення поля форми.
 * Назви параметрів будує Hydrogen: власної таблиці відповідностей тут немає.
 */
export function filterParamEntries(input: string): { name: string; value: string }[] {
  const filter = parseFilterInput(input);
  if (!filter) return [];

  return Array.from(
    serializeCollectionParams({ filters: [filter], sortKey: undefined, reverse: false }),
    ([name, value]) => ({ name, value }),
  );
}

/** Наявність і BOOLEAN-фільтри мають одне значення: друге скасовує перше. */
export function isExclusiveFilter(filter: Pick<CollectionFilter, "type">, name: string): boolean {
  return filter.type === "BOOLEAN" || name === "filter.v.availability";
}

export function activePrice(filters: readonly ProductFilter[]): ProductFilter["price"] {
  return filters.find((filter) => filter.price != null)?.price;
}

/** Скільки значень групи зараз увімкнено: число біля назви групи. */
export function activeValueCount(
  filter: CollectionFilter,
  activeFilters: readonly ProductFilter[],
): number {
  if (filter.type === "PRICE_RANGE") return activePrice(activeFilters) ? 1 : 0;
  return filter.values.filter((value) => isFilterInputActive([...activeFilters], value.input))
    .length;
}

/** Крок повзунка: дрібніший для дешевих каталогів, більший для дорогих. */
export function priceStep(ceiling: number): number {
  if (ceiling <= 100) return 1;
  if (ceiling <= 2000) return 10;
  if (ceiling <= 20000) return 100;
  return 500;
}

/**
 * Верхня межа повзунка ціни: з фільтра PRICE_RANGE, а якщо його немає — із запасного значення.
 * Округлюється вгору до кроку, щоб повзунок доходив до найдорожчого товару.
 */
export function priceCeiling(filters: readonly CollectionFilter[], fallback: number): number {
  const priceFilter = filters.find((filter) => filter.type === "PRICE_RANGE");
  const fromFilter = priceFilter?.values
    .map((value) => parseFilterInput(value.input)?.price?.max)
    .find((max): max is number => typeof max === "number" && max > 0);

  const ceiling = fromFilter ?? fallback;
  if (!Number.isFinite(ceiling) || ceiling <= 0) return 0;

  const step = priceStep(ceiling);
  return Math.ceil(ceiling / step) * step;
}

/**
 * Ціна фільтрується в будь-якому магазині Storefront API, навіть коли список `filters` порожній
 * (так на mock.shop). Тому фільтр ціни додаємо самі, якщо магазин його не повернув.
 * TODO(реальний магазин): якщо у Search & Discovery фільтр ціни вимкнули навмисно, прибрати цей запасний варіант.
 */
export function withPriceFilter(
  filters: readonly CollectionFilter[],
  ceiling: number,
): CollectionFilter[] {
  if (ceiling <= 0 || filters.some((filter) => filter.type === "PRICE_RANGE")) return [...filters];

  return [
    {
      id: FALLBACK_PRICE_FILTER_ID,
      label: "Ціна",
      type: "PRICE_RANGE",
      values: [
        {
          id: FALLBACK_PRICE_FILTER_ID,
          label: "Ціна",
          count: 0,
          input: JSON.stringify({ price: { min: 0, max: ceiling } }),
        },
      ],
    },
    ...filters,
  ];
}

/* ── Кольори ──────────────────────────────────────────────────────────── */

/**
 * Назви кольорів → зразок. Це дані товарів, а не кольори інтерфейсу: потрібні, коли магазин
 * віддає фільтр кольору без swatch (звичайна опція варіанта «Колір»).
 */
const COLOR_NAMES: Readonly<Record<string, string>> = {
  чорний: "#1d1d1f",
  black: "#1d1d1f",
  графітовий: "#4a4a4f",
  graphite: "#4a4a4f",
  сірий: "#8e8e93",
  grey: "#8e8e93",
  gray: "#8e8e93",
  срібний: "#e3e4e5",
  сріблястий: "#e3e4e5",
  silver: "#e3e4e5",
  білий: "#ffffff",
  white: "#ffffff",
  бежевий: "#e8dccb",
  beige: "#e8dccb",
  золотий: "#e6c9a0",
  gold: "#e6c9a0",
  жовтий: "#f7d94c",
  yellow: "#f7d94c",
  помаранчевий: "#f08a3c",
  orange: "#f08a3c",
  червоний: "#d6263b",
  red: "#d6263b",
  рожевий: "#f4c2d0",
  pink: "#f4c2d0",
  фіолетовий: "#7d6bd6",
  purple: "#7d6bd6",
  синій: "#2f5fa8",
  blue: "#2f5fa8",
  блакитний: "#9ec9ea",
  зелений: "#4f8a5b",
  green: "#4f8a5b",
  коричневий: "#7a5a43",
  brown: "#7a5a43",
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/;
const WORD_SEPARATOR = /[\s,/-]+/;

/** Колір зразка: зі swatch, із самого значення (#hex) або з назви («Синій титан» → синій). */
export function swatchColor(value: Pick<CollectionFilterValue, "label" | "swatch">): string | null {
  if (value.swatch?.color) return value.swatch.color;

  const label = value.label.trim().toLowerCase();
  if (HEX_COLOR.test(label)) return label;

  for (const word of label.split(WORD_SEPARATOR)) {
    const color = COLOR_NAMES[word];
    if (color) return color;
  }
  return null;
}

export function swatchImage(
  value: Pick<CollectionFilterValue, "swatch">,
): { url: string; altText?: string | null } | null {
  return value.swatch?.image?.previewImage ?? null;
}

/** Група показується зразками, якщо так налаштовано в магазині або всі значення схожі на колір. */
export function isSwatchFilter(filter: CollectionFilter): boolean {
  if (filter.type !== "LIST" || filter.values.length === 0) return false;
  if (filter.presentation === "SWATCH") return true;
  return filter.values.every((value) => swatchColor(value) !== null || swatchImage(value) !== null);
}

/* ── Підписи ──────────────────────────────────────────────────────────── */

const PRODUCT_FORMS = { one: "товар", few: "товари", many: "товарів" };

/** «9 товарів», «1 товар». */
export function productCountLabel(count: number): string {
  return `${formatInteger(count)} ${plural(count, PRODUCT_FORMS)}`;
}

function priceLabel(price: NonNullable<ProductFilter["price"]>, currencyCode: string): string {
  const money = (amount: number) => formatPrice({ amount: String(amount), currencyCode });
  if (price.min != null && price.max != null) return `${money(price.min)} – ${money(price.max)}`;
  if (price.min != null) return `від ${money(price.min)}`;
  if (price.max != null) return `до ${money(price.max)}`;
  return "будь-яка";
}

/** Підпис увімкненого фільтра для чипа: «Пам'ять: 256 ГБ», «Ціна: від 100 ₴». */
export function filterLabel(
  filter: ProductFilter,
  available: readonly CollectionFilter[],
  currencyCode: string,
): string {
  if (filter.price) return `Ціна: ${priceLabel(filter.price, currencyCode)}`;

  for (const group of available) {
    const value = group.values.find((candidate) => isFilterInputActive([filter], candidate.input));
    if (value) return group.type === "BOOLEAN" ? value.label : `${group.label}: ${value.label}`;
  }

  // Значення є в адресі, але магазин його вже не пропонує (наприклад, інші фільтри його виключили).
  if (filter.available != null) return filter.available ? "В наявності" : "Немає в наявності";
  if (filter.variantOption) {
    return `${filter.variantOption.name}: ${filter.variantOption.value ?? ""}`;
  }
  return (
    filter.productType ??
    filter.productVendor ??
    filter.tag ??
    filter.productMetafield?.value ??
    filter.variantMetafield?.value ??
    filter.taxonomyMetafield?.value ??
    "Фільтр"
  );
}

export type ActiveFilterChip = { key: string; label: string; href: string };

/** Чипи ввімкнених фільтрів з адресами «прибрати один» і «скинути все» (сортування лишається). */
export function activeFilterChips(
  state: BrowseState,
  available: readonly CollectionFilter[],
  currencyCode: string,
  pathname: string,
): { chips: ActiveFilterChip[]; clearHref: string } {
  const currentParams = serializeCollectionParams(state);

  const chips = state.filters.map((filter, index) => {
    const removal = getFilterRemovalUrl(currentParams, filter);
    const href = removal === "?" ? pathname : `${pathname}${removal}`;
    return { key: `${index}-${href}`, label: filterLabel(filter, available, currencyCode), href };
  });

  const clearHref = withSearch(
    pathname,
    serializeCollectionParams({ filters: [], sortKey: state.sortKey, reverse: state.reverse }),
  );

  return { chips, clearHref };
}

/** Параметри ввімкнених фільтрів без сортування: приховані поля форми сортування. */
export function activeFilterParams(filters: ProductFilter[]): [name: string, value: string][] {
  return Array.from(serializeCollectionParams({ filters, sortKey: undefined, reverse: false }));
}

/** Те саме, що parseCollectionParams, але з рядка пошуку з «?» або без нього. */
export function parseBrowseSearch(search: string): BrowseState {
  return parseCollectionParams(new URLSearchParams(search));
}
