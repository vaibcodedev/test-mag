import { gql } from "@shopify/hydrogen";

/**
 * Усе, що потрібно картці товару, разом із метаполями custom.*.
 * Кольори й опції мають псевдоніми з префіксом card: запити, які розгортають цей фрагмент,
 * самі читають `options` з іншими аргументами, і без псевдоніма поля б конфліктували.
 *
 * `selectedOrFirstAvailableVariant` — єдине джерело варіанта, ціни й старої ціни картки:
 * кнопка «Купити» кладе в кошик саме той варіант, ціну якого показано. `priceRange` потрібен,
 * щоб помітити товар із різними цінами варіантів: тоді картка показує «від» і веде на сторінку.
 */
export const PRODUCT_CARD_FRAGMENT = gql(`
  fragment ProductCardFields on Product {
    id
    handle
    title
    availableForSale
    featuredImage {
      url
      altText
      width
      height
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    badge: metafield(namespace: "custom", key: "badge") {
      value
    }
    installmentMonths: metafield(namespace: "custom", key: "installment_months") {
      value
    }
    conditionGrade: metafield(namespace: "custom", key: "condition_grade") {
      value
    }
    batteryHealth: metafield(namespace: "custom", key: "battery_health") {
      value
    }
    cardColorSwatches: metafield(namespace: "custom", key: "color_swatches") {
      value
    }
    cardOptions: options(first: 3) {
      name
      optionValues {
        name
        swatch {
          color
        }
      }
    }
  }
`);
