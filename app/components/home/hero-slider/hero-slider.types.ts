import type { ColorSwatch } from "~/components/product/color-swatches";
import type { ProductCardImage } from "~/components/product/product-card";
import type { CompareCategoryKey } from "~/lib/compare/spec-schema";
import type { Money } from "~/lib/format";

/** Колір у банері. Якщо в кольору є власне посилання чи фото, вибір їх підміняє. */
export type HomeBannerColor = ColorSwatch & {
  /** Посилання на варіант цього кольору. */
  href?: string | null;
  image?: ProductCardImage | null;
};

/** Вміст одного запису метаоб'єкта `home_banner`. */
export type HomeBanner = {
  id: string;
  /** Лейбл над заголовком: «Новинка осені». */
  label?: string | null;
  /** Заголовок цілком: «iPhone 17 Pro». */
  title: string;
  /** Слово із заголовка, яке виділяється lime: «Pro». */
  accent?: string | null;
  subtitle?: string | null;
  /** Чипи характеристик: «A19 Pro», «Камери 48 Мп». */
  specs?: readonly string[];
  colors?: readonly HomeBannerColor[];
  price: Money | null;
  /** «від» перед ціною; без значення — показується. */
  priceFrom?: boolean;
  /** Кількість платежів; без значення — 25. */
  installmentMonths?: number | null;
  image: ProductCardImage | null;
  /** Посилання кнопки «Купити»: сторінка товару. */
  href: string;
  /**
   * Handle товару банера. З ним кнопка «Порівняти» додає товар до порівняння й відкриває
   * /compare. Є лише в банерів, прив'язаних до товару (поле `product` метаоб'єкта).
   */
  productHandle?: string | null;
  /**
   * Категорія порівняння товару банера. Без неї (аксесуар чи невідомий тип товару)
   * кнопки «Порівняти» немає.
   */
  compareCategory?: CompareCategoryKey | null;
  /**
   * Посилання на всі моделі лінійки (колекцію). Без productHandle показується кнопкою
   * «Усі моделі»; без обох другої кнопки немає.
   */
  compareHref?: string | null;
  /** Плашка про доставку: «Доставимо завтра». */
  delivery?: string | null;
};
