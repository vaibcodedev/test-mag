import type { DealsTickerItem } from "./deals-ticker";

/**
 * TODO(реальний магазин): позиції збирати з товарів колекції `deals`
 * (назва + відсоток між price і compareAtPrice), окремого метаоб'єкта не потрібно.
 */
export const DEALS_TICKER_DEMO_ITEMS: DealsTickerItem[] = [
  {
    title: "MacBook Air 13 M4",
    discount: "−8%",
    to: "/products/macbook-air-13-m4-256-midnight",
  },
  {
    title: "Apple Watch Series 11",
    discount: "−8%",
    to: "/products/apple-watch-series-11-46-black",
  },
  { title: "AirPods Pro 3", discount: "−8%", to: "/products/airpods-pro-3" },
  { title: "iPad Air 11 M3", discount: "−6%", to: "/products/ipad-air-11-m3-128-blue" },
  { title: "Чохли MagSafe", discount: "−20%", to: "/collections/accessories" },
  { title: "Вживані iPhone 14", discount: "−10%", to: "/collections/used" },
];
