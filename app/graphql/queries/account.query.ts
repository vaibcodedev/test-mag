import { gql } from "@shopify/hydrogen/customer-account";

/**
 * Профіль покупця та його замовлення (Customer Account API) з курсорною пагінацією.
 * З кожного замовлення беремо перші чотири позиції для мініатюр; скільки їх усього —
 * каже `lineItemsSummary`.
 */
export const ACCOUNT_QUERY = gql(`
  query AccountPage($first: Int, $after: String, $last: Int, $before: String) {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      orders(
        first: $first
        after: $after
        last: $last
        before: $before
        sortKey: PROCESSED_AT
        reverse: true
      ) {
        nodes {
          id
          name
          processedAt
          cancelledAt
          financialStatus
          fulfillmentStatus
          statusPageUrl
          totalPrice {
            amount
            currencyCode
          }
          lineItemsSummary {
            lineItemCount
            totalQuantityOfLineItems
          }
          lineItems(first: 4) {
            nodes {
              id
              title
              quantity
              image {
                url
                width
                height
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
      }
    }
  }
`);
