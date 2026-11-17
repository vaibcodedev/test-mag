/**
 * Дані магазину та навігація.
 *
 * TODO(реальний магазин): store_info читати з метаоб'єкта `store_info`, меню — з меню Shopify.
 * Поки магазин не підключено (mock.shop не має метаоб'єктів), тут лежать демо-дані з ТЗ.
 */

export type StoreInfo = {
  name: string;
  postalCode: string;
  city: string;
  street: string;
  latitude: number;
  longitude: number;
  /** Текст для людей: «щодня 10:00–20:00». */
  hours: string;
  opens: string;
  closes: string;
  phone: string;
  phoneHref: string;
  telegramHandle: string;
  telegramUrl: string;
  legalName: string;
  taxId: string;
};

export const STORE_INFO: StoreInfo = {
  name: "Ionov Store",
  postalCode: "21050",
  city: "Вінниця",
  street: "вул. Соборна, 64",
  latitude: 49.2331,
  longitude: 28.4682,
  hours: "щодня 10:00–20:00",
  opens: "10:00",
  closes: "20:00",
  phone: "068 129 99 00",
  phoneHref: "tel:+380681299900",
  telegramHandle: "@ionov_store",
  telegramUrl: "https://t.me/ionov_store",
  legalName: "ФОП Іонов О. В.",
  taxId: "3214509876",
};

export function storeAddress(store: StoreInfo = STORE_INFO): string {
  return `${store.postalCode}, ${store.city}, ${store.street}`;
}

export function mapsUrl(store: StoreInfo = STORE_INFO): string {
  return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
}

export function directionsUrl(store: StoreInfo = STORE_INFO): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
}

export type NavLink = { title: string; to: string };

/** Колекції каталогу в порядку показу. */
export const CATALOG_LINKS: NavLink[] = [
  { title: "iPhone", to: "/collections/iphone" },
  { title: "Mac", to: "/collections/mac" },
  { title: "iPad", to: "/collections/ipad" },
  { title: "Watch", to: "/collections/watch" },
  { title: "AirPods", to: "/collections/airpods" },
  { title: "Аксесуари", to: "/collections/accessories" },
  { title: "Вживані", to: "/collections/used" },
  { title: "Для навчання", to: "/collections/students" },
  { title: "Знижки", to: "/collections/deals" },
];

/** Сервісні сторінки у верхній смузі. */
export const SERVICE_LINKS: NavLink[] = [
  { title: "Доставка й оплата", to: "/pages/delivery" },
  { title: "Гарантія", to: "/pages/warranty" },
  { title: "Перевірка IMEI", to: "/pages/imei" },
  { title: "Trade-in", to: "/pages/trade-in" },
  { title: "Блог", to: "/blogs/blog" },
];

export const SHOWROOM_LINK: NavLink = { title: "Шоурум у Вінниці", to: "/pages/contacts" };

export const BUYER_LINKS: NavLink[] = [
  { title: "Доставка й оплата", to: "/pages/delivery" },
  { title: "Оплата частинами", to: "/pages/installments" },
  { title: "Гарантія", to: "/pages/warranty" },
  { title: "Обмін і повернення", to: "/pages/returns" },
  { title: "Trade-in", to: "/pages/trade-in" },
  { title: "Перевірка IMEI", to: "/pages/imei" },
];

export const COMPANY_LINKS: NavLink[] = [
  { title: "Про Ionov Store", to: "/#about" },
  { title: "Шоурум і контакти", to: "/pages/contacts" },
  { title: "Блог", to: "/blogs/blog" },
  { title: "Відгуки", to: "/#reviews" },
];

/** Способи оплати, які показуємо у футері. */
export const PAYMENT_METHODS = ["Visa", "Mastercard", "Apple Pay", "monobank", "ПриватБанк"];
