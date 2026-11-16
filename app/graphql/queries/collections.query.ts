import { gql } from "@shopify/hydrogen";

/** Список колекцій для сторінки «Каталог». Фото першого товару — запасне, якщо колекція без фото. */
export const COLLECTIONS_QUERY = gql(`
  query CollectionsList($first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
        description
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
