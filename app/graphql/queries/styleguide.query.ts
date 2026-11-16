import { gql } from "@shopify/hydrogen";

/** Кілька товарів магазину, щоб показати картки у /styleguide зі справжніми фото з CDN. */
export const STYLEGUIDE_PRODUCTS_QUERY = gql(`
  query StyleguideProducts($first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: $first) {
      nodes {
        handle
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
