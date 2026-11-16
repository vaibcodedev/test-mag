import { gql } from "@shopify/hydrogen";

import { ARTICLE_CARD_FRAGMENT } from "~/graphql/fragments/article-card.fragment";

/** Список статей блогу з курсорною пагінацією в обидва боки. */
export const BLOG_QUERY = gql(
  `
    query BlogArticles(
      $blog: String!
      $first: Int
      $after: String
      $last: Int
      $before: String
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      blog(handle: $blog) {
        handle
        title
        seo {
          title
          description
        }
        articles(
          first: $first
          after: $after
          last: $last
          before: $before
          sortKey: PUBLISHED_AT
          reverse: true
        ) {
          nodes {
            ...ArticleCardFields
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    }
  `,
  [ARTICLE_CARD_FRAGMENT],
);

/** Стаття за handle і кілька свіжих статей того самого блогу для «Читайте також». */
export const ARTICLE_QUERY = gql(
  `
    query BlogArticle(
      $blog: String!
      $handle: String!
      $related: Int!
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      blog(handle: $blog) {
        handle
        title
        articleByHandle(handle: $handle) {
          ...ArticleCardFields
          contentHtml
          authorV2 {
            name
          }
          seo {
            title
            description
          }
        }
        articles(first: $related, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            ...ArticleCardFields
          }
        }
      }
    }
  `,
  [ARTICLE_CARD_FRAGMENT],
);
