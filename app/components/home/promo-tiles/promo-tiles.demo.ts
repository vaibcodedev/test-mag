import { demoImage, uah } from "~/components/home/home.fixtures";

import type { PromoProductTile, PromoTradeInTile } from "./promo-tiles";

// TODO(реальний магазин): новинка — перший товар із метаполем custom.badge = «Новинка»,
// товар зі знижкою — перший товар колекції deals (обидва зі Storefront API).
export const DEMO_PROMO_NEW: PromoProductTile = {
  title: "Apple Watch Series 11",
  caption: "Стежить за сном і тримає заряд до 24 годин",
  to: "/products/apple-watch-series-11-46-black",
  image: demoImage(2),
  price: uah(21999),
};

export const DEMO_PROMO_SALE: PromoProductTile = {
  title: "MacBook Air 13 M4",
  caption: "16/256 ГБ, темна ніч",
  to: "/products/macbook-air-13-m4-256-midnight",
  image: demoImage(1),
  price: uah(49999),
  compareAtPrice: uah(54499),
};

// TODO(реальний магазин): тексти й сума плитки Trade-in — окремий запис метаоб'єкта
// `home_banner` (або поля сторінки /pages/trade-in), щоб суму можна було міняти з адмінки.
export const DEMO_PROMO_TRADE_IN: PromoTradeInTile = {
  title: "Trade-in",
  caption: "Здайте старий пристрій і заплатіть менше за новий",
  maxAmount: uah(24500),
  to: "/pages/trade-in",
};
