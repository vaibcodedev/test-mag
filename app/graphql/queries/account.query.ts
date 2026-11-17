import { gql } from "@shopify/hydrogen/customer-account";

/**
 * Профіль покупця та його замовлення (Customer Account API) з курсорною пагінацією,
 * сортуванням і пошуком за датою (`processed_at`).
 * З кожного замовлення беремо до тридцяти позицій: перші йдуть у мініатюри, а з усіх
 * рахуємо кількість товарів. Поля `lineItemsSummary` у запиті немає навмисно: воно є
 * у схемі, що йде з бібліотекою, але живий API магазину відповідає «Field doesn't exist»,
 * і через нього не завантажувався весь кабінет.
 */
export const ACCOUNT_QUERY = gql(`
  query AccountPage(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $sortKey: OrderSortKeys
    $reverse: Boolean
    $query: String
  ) {
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
        sortKey: $sortKey
        reverse: $reverse
        query: $query
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
          lineItems(first: 30) {
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
