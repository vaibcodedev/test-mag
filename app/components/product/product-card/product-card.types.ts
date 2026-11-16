import type { ColorSwatch } from "~/components/product/color-swatches";
import type { ConditionGrade } from "~/components/product/used-grade";
import type { Money } from "~/lib/format";

/** Значення метаполя custom.badge. */
export type ProductBadge = "Новинка" | "Хіт" | "Топ";

export type ProductCardImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Дані картки. Маршрут збирає їх із відповіді Storefront API (фрагмент у app/graphql/),
 * тож сама картка не залежить від форми запиту.
 */
export type ProductCardData = {
  handle: string;
  /**
   * Варіант, який кнопка «Купити» кладе в кошик; `price` і `compareAtPrice` — саме його.
   * Без нього картка веде на сторінку товару.
   */
  variantId?: string | null;
  /** Повна назва з пам'яттю та кольором. */
  title: string;
  image: ProductCardImage | null;
  price: Money;
  /** Варіанти коштують по-різному: `price` — найменша ціна, картка показує «від». */
  priceFrom?: boolean;
  compareAtPrice?: Money | null;
  availableForSale: boolean;
  badge?: ProductBadge | null;
  rating?: { value: number; count: number } | null;
  /** custom.installment_months; без значення — 25. */
  installmentMonths?: number | null;
  colors?: readonly ColorSwatch[];
  /** Готовий підпис про доставку: «доставимо завтра». */
  delivery?: string | null;
  /** Лише для вживаних пристроїв. */
  used?: { grade: ConditionGrade; batteryHealth?: number | null } | null;
};
