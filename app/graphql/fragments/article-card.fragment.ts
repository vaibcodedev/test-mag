import { gql } from "@shopify/hydrogen";

/** Поля картки статті: фото, дата, заголовок, уривок. */
export const ARTICLE_CARD_FRAGMENT = gql(`
  fragment ArticleCardFields on Article {
    id
    handle
    title
    excerpt
    publishedAt
    image {
      url
      altText
      width
      height
    }
  }
`);
