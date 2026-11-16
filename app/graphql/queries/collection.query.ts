import { gql } from "@shopify/hydrogen";

import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments/product-card.fragment";

/**
 * Сторінка колекції: товари з фільтрами, сортуванням і курсорною пагінацією.
 *
 * - `priceCeiling` — найдорожчий товар колекції, верхня межа повзунка ціни,
 *   якщо магазин не повернув фільтр PRICE_RANGE.
 * - Валюта береться тим самим запитом, що й ціни товарів.
 */
export const COLLECTION_QUERY = gql(
  `
    query CollectionPage(
      $handle: String!
      $first: Int
      $last: Int
      $after: String
      $before: String
      $sortKey: ProductCollectionSortKeys
      $reverse: Boolean
      $filters: [ProductFilter!]
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      shop {
        paymentSettings {
          currencyCode
        }
      }
      collection(handle: $handle) {
        id
        handle
        title
        description
        seo {
          title
          description
        }
        image {
          url
          altText
          width
          height
        }
        products(
          first: $first
          last: $last
          after: $after
          before: $before
          sortKey: $sortKey
          reverse: $reverse
          filters: $filters
        ) {
          filters {
            id
            label
            type
            presentation
            values {
              id
              label
              count
              input
              swatch {
                color
                image {
                  previewImage {
                    url
                    altText
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          nodes {
            ...ProductCardFields
          }
        }
        priceCeiling: products(first: 1, sortKey: PRICE, reverse: true) {
          nodes {
            priceRange {
              maxVariantPrice {
                amount
              }
            }
          }
        }
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT],
);

/**
 * Кількість товарів колекції з тими самими фільтрами: у ProductConnection немає totalCount.
 * Окремий запит, бо разом зі сторінкою товарів він упирався б у ліміт складності Storefront API.
 */
export const COLLECTION_COUNT_QUERY = gql(`
  query CollectionProductCount(
    $handle: String!
    $first: Int!
    $filters: [ProductFilter!]
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first, filters: $filters) {
        nodes {
          id
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`);
