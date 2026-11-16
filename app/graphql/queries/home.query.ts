import { gql } from "@shopify/hydrogen";

import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments/product-card.fragment";

/**
 * Товари для секцій головної: перші товари магазину («Популярне») і дві колекції —
 * `deals` («Знижки тижня») та `used` («Вживана техніка»). Колекції, якої в магазині немає,
 * відповідає `null`, і її секція на головній не показується.
 */
export const HOME_PRODUCTS_QUERY = gql(
  `
    query HomeProducts(
      $first: Int!
      $deals: Int!
      $used: Int!
      $country: CountryCode
      $language: LanguageCode
    )
    @inContext(country: $country, language: $language) {
      products(first: $first) {
        nodes {
          ...ProductCardFields
        }
      }
      deals: collection(handle: "deals") {
        products(first: $deals) {
          nodes {
            ...ProductCardFields
          }
        }
      }
      used: collection(handle: "used") {
        products(first: $used) {
          nodes {
            ...ProductCardFields
          }
        }
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT],
);

/** Колекції каталогу з фото та кількома товарами для мініатюр. */
export const LAYOUT_CATALOG_QUERY = gql(`
  query LayoutCatalog($collections: Int!, $products: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: $collections) {
      nodes {
        handle
        image {
          url
          altText
          width
          height
        }
      }
    }
    products(first: $products) {
      nodes {
        featuredImage {
          url
          altText
          width
          height
        }
      }
    }
  }
`);
