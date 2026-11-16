import type { PopularProductsContent, PopularProductsTab } from "./popular-products";

/**
 * TODO(реальний магазин): заголовок і вкладки читати з метаоб'єкта `home_popular`
 * (заголовок, опис, список колекцій); товари першої вкладки — з її колекції.
 */
export const POPULAR_PRODUCTS_DEMO_CONTENT: PopularProductsContent = {
  title: "Популярні товари",
  description: "Те, що у нас купують найчастіше цього місяця.",
  tabsLabel: "Добірки популярних товарів",
};

/** Перша вкладка — та, чиї товари показано в секції. */
export const POPULAR_PRODUCTS_DEMO_TABS: PopularProductsTab[] = [
  { title: "Хіти", to: "/collections/hits" },
  { title: "Новинки", to: "/collections/new" },
  { title: "Для навчання", to: "/collections/students" },
  { title: "Аксесуари", to: "/collections/accessories" },
];
