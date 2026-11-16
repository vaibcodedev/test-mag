import { gql } from "@shopify/hydrogen";

/** Сторінка магазину за handle: заголовок, HTML із адмінки та SEO. */
export const PAGE_QUERY = gql(`
  query ContentPage($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      handle
      title
      body
      bodySummary
      updatedAt
      seo {
        title
        description
      }
    }
  }
`);
