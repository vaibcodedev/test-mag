import { gql } from "@shopify/hydrogen";

import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments/product-card.fragment";

/**
 * Товари для секцій головної: «Популярне» (колекція `hits`, а якщо її немає — перші товари магазину) і дві колекції —
 * `deals` («Знижки тижня») та `used` («Вживана техніка»). Колекції, якої в магазині немає,
 * відповідає `null`, і її секція на головній не показується.
 */
export const HOME_PRODUCTS_QUERY = gql(
  `
    query HomeProducts(
      $first: Int!
      $deals: Int!
      $used: Int!
      $iphones: Int!
      $country: CountryCode
      $language: LanguageCode
    )
    @inContext(country: $country, language: $language) {
      products(first: $first) {
        nodes {
          ...ProductCardFields
        }
      }
      hits: collection(handle: "hits") {
        products(first: $first) {
          nodes {
            ...ProductCardFields
          }
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
      newest: collection(handle: "new") {
        products(first: 1) {
          nodes {
            ...ProductCardFields
          }
        }
      }
      iphones: collection(handle: "iphone") {
        products(first: $iphones) {
          nodes {
            handle
            featuredImage {
              url
              altText
              width
              height
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT],
);

/** Колекції каталогу з фото; якщо свого фото в колекції немає — фото її першого товару. */
export const LAYOUT_CATALOG_QUERY = gql(`
  query LayoutCatalog($collections: Int!, $country: CountryCode, $language: LanguageCode)
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
        products(first: 1) {
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
    }
  }
`);
