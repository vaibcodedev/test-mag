/** Скільки замовлень на сторінці списку: картки високі, тож чотири — це близько двох екранів. */
export const ORDERS_PAGE_SIZE = 4;

export const ORDER_SORT_PARAM = "sort";
export const ORDER_PERIOD_PARAM = "period";

export type OrdersSort = {
  value: string;
  label: string;
  /** Ключ сортування Customer Account API (`OrderSortKeys`). */
  sortKey: "PROCESSED_AT" | "TOTAL_PRICE";
  reverse: boolean;
};

export type OrdersPeriod = {
  value: string;
  label: string;
  /** За скільки останніх днів показувати замовлення; null — за весь час. */
  days: number | null;
};

/** Перший варіант — типовий: його в адресі не пишемо. */
export const ORDER_SORTS: readonly OrdersSort[] = [
  { value: "new", label: "Спочатку нові", sortKey: "PROCESSED_AT", reverse: true },
  { value: "old", label: "Спочатку давні", sortKey: "PROCESSED_AT", reverse: false },
  { value: "expensive", label: "Спочатку дорожчі", sortKey: "TOTAL_PRICE", reverse: true },
  { value: "cheap", label: "Спочатку дешевші", sortKey: "TOTAL_PRICE", reverse: false },
];

/**
 * Фільтр за часом: Customer Account API вміє шукати замовлення за датою (`processed_at`),
 * а за станом оплати чи доставки — ні, тому вкладок «активні / виконані» тут немає.
 */
export const ORDER_PERIODS: readonly OrdersPeriod[] = [
  { value: "all", label: "За весь час", days: null },
  { value: "30d", label: "За 30 днів", days: 30 },
  { value: "6m", label: "За пів року", days: 183 },
  { value: "1y", label: "За рік", days: 365 },
];

const DEFAULT_SORT = ORDER_SORTS[0] as OrdersSort;
const DEFAULT_PERIOD = ORDER_PERIODS[0] as OrdersPeriod;

/** Вибір покупця в списку замовлень: значення параметрів адреси. */
export type OrdersListChoice = { sort: string; period: string };

export const DEFAULT_ORDERS_CHOICE: OrdersListChoice = {
  sort: DEFAULT_SORT.value,
  period: DEFAULT_PERIOD.value,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Розбирає адресу списку замовлень у змінні запиту. Невідомі значення `sort` і `period`
 * стають типовими, тож зіпсована адреса показує звичайний список, а не помилку.
 */
export function parseOrdersList(searchParams: URLSearchParams, now: Date = new Date()) {
  const sort =
    ORDER_SORTS.find((option) => option.value === searchParams.get(ORDER_SORT_PARAM)) ??
    DEFAULT_SORT;
  const period =
    ORDER_PERIODS.find((option) => option.value === searchParams.get(ORDER_PERIOD_PARAM)) ??
    DEFAULT_PERIOD;

  const before = searchParams.get("before");
  const page = before
    ? { last: ORDERS_PAGE_SIZE, before }
    : { first: ORDERS_PAGE_SIZE, after: searchParams.get("after") };

  // Дата без часу: запит однаковий протягом дня.
  const since =
    period.days === null
      ? null
      : new Date(now.getTime() - period.days * DAY_MS).toISOString().slice(0, 10);

  return {
    choice: { sort: sort.value, period: period.value } satisfies OrdersListChoice,
    variables: {
      ...page,
      sortKey: sort.sortKey,
      reverse: sort.reverse,
      query: since ? `processed_at:>=${since}` : null,
    },
  };
}

/**
 * Адреса списку для вибраного сортування й періоду. Типові значення в адресу не пишемо.
 * Курсор сторінки додаємо лише для переходу «новіші / старіші»: зміна сортування чи періоду
 * починає список спочатку.
 */
export function ordersListSearch(
  choice: OrdersListChoice,
  cursor?: { name: "before" | "after"; value: string },
): string {
  const params = new URLSearchParams();
  if (choice.sort !== DEFAULT_SORT.value) params.set(ORDER_SORT_PARAM, choice.sort);
  if (choice.period !== DEFAULT_PERIOD.value) params.set(ORDER_PERIOD_PARAM, choice.period);
  if (cursor) params.set(cursor.name, cursor.value);
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Чи звузив покупець список: тоді порожній результат — не «замовлень ще немає». */
export function ordersListFiltered(choice: OrdersListChoice): boolean {
  return choice.period !== DEFAULT_PERIOD.value;
}
