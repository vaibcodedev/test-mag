import { gql } from "@shopify/hydrogen";

import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments/product-card.fragment";

/** Сторінка результатів пошуку: лише товари, з курсорами в обидва боки. */
export const SEARCH_QUERY = gql(
  `
    query SearchPage(
      $term: String!
      $first: Int
      $after: String
      $last: Int
      $before: String
      $sortKey: SearchSortKeys
      $reverse: Boolean
      $productFilters: [ProductFilter!]
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      search(
        query: $term
        types: [PRODUCT]
        first: $first
        after: $after
        last: $last
        before: $before
        sortKey: $sortKey
        reverse: $reverse
        productFilters: $productFilters
      ) {
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        nodes {
          __typename
          ... on Product {
            ...ProductCardFields
          }
        }
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT],
);
