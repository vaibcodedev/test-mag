import { gql } from "@shopify/hydrogen";

/** Запити для sitemap.xml: лише handle і дата зміни, сторінками за курсором. */

export const SITEMAP_PRODUCTS_QUERY = gql(`
  query SitemapProducts($first: Int!, $after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: $first, after: $after) {
      nodes {
        handle
        updatedAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export const SITEMAP_COLLECTIONS_QUERY = gql(`
  query SitemapCollections($first: Int!, $after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: $first, after: $after) {
      nodes {
        handle
        updatedAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export const SITEMAP_PAGES_QUERY = gql(`
  query SitemapPages($first: Int!, $after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    pages(first: $first, after: $after) {
      nodes {
        handle
        updatedAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

/** У статті немає updatedAt, тому для lastmod береться дата публікації. */
export const SITEMAP_ARTICLES_QUERY = gql(`
  query SitemapArticles($first: Int!, $after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    articles(first: $first, after: $after) {
      nodes {
        handle
        publishedAt
        blog {
          handle
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
