import { gql } from "@shopify/hydrogen";

/**
 * Варіанти з минулого замовлення, як їх зараз бачить вітрина (Storefront API): чи продаються
 * й чи є в наявності. Варіанта, якого вже немає або який знято з продажу, у відповіді
 * немає — на його місці `null`.
 */
export const REORDER_VARIANTS_QUERY = gql(`
  query ReorderVariants($ids: [ID!]!) {
    nodes(ids: $ids) {
      __typename
      ... on ProductVariant {
        id
        availableForSale
        title
        price {
          amount
          currencyCode
        }
        image {
          url
          altText
          width
          height
        }
        selectedOptions {
          name
          value
        }
        product {
          title
          handle
        }
      }
    }
  }
`);
