import { gql } from "@shopify/hydrogen/customer-account";

/**
 * Сторінка одного замовлення. Дані розбито на три запити навмисно: схема, що йде з бібліотекою,
 * новіша за живий API магазину, і поле, якого API не знає, обвалює весь запит. Тому основний
 * запит містить лише давні, перевірені поля, а знижки з поверненнями та відправлення
 * запитуються окремо — якщо такий запит не пройде, зі сторінки зникне один блок.
 *
 * Кожне поле звірено з довідником Customer Account API 2026-10 (shopify-dev MCP, validate).
 * Полів `lineItemsSummary`, `discountInformation`, `subtotalBeforeDiscounts`,
 * `totalDiscountedShipping` і `CustomerAddress.countryCode` там немає, хоча в схемі бібліотеки
 * вони є, — не додавайте їх.
 */
export const ORDER_QUERY = gql(`
  query AccountOrder($id: ID!) {
    order(id: $id) {
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
      subtotal {
        amount
        currencyCode
      }
      totalShipping {
        amount
        currencyCode
      }
      totalTax {
        amount
        currencyCode
      }
      shippingAddress {
        name
        address1
        address2
        city
        zip
        province
        country
        phoneNumber
      }
      lineItems(first: 100) {
        nodes {
          id
          title
          variantTitle
          quantity
          image {
            url
            altText
            width
            height
          }
          price {
            amount
            currencyCode
          }
          totalPrice {
            amount
            currencyCode
          }
          totalDiscount {
            amount
            currencyCode
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`);

/** Знижки, спосіб доставки, причина скасування й повернення коштів. Другорядний запит. */
export const ORDER_ADJUSTMENTS_QUERY = gql(`
  query AccountOrderAdjustments($id: ID!) {
    order(id: $id) {
      id
      cancelReason
      totalRefunded {
        amount
        currencyCode
      }
      shippingLine {
        title
      }
      discountApplications(first: 20) {
        nodes {
          __typename
          targetType
          ... on DiscountCodeApplication {
            code
          }
          ... on AutomaticDiscountApplication {
            title
          }
          ... on ManualDiscountApplication {
            title
          }
          ... on ScriptDiscountApplication {
            title
          }
          value {
            __typename
            ... on MoneyV2 {
              amount
              currencyCode
            }
            ... on PricingPercentageValue {
              percentage
            }
          }
        }
      }
      refunds {
        id
        createdAt
        returnName
        totalRefunded {
          amount
          currencyCode
        }
      }
    }
  }
`);

/** Відправлення з перевізником і номером для відстеження. Другорядний запит. */
export const ORDER_SHIPMENTS_QUERY = gql(`
  query AccountOrderShipments($id: ID!) {
    order(id: $id) {
      id
      fulfillments(first: 20) {
        nodes {
          id
          createdAt
          estimatedDeliveryAt
          latestShipmentStatus
          status
          trackingInformation {
            company
            number
            url
          }
          fulfillmentLineItems(first: 50) {
            nodes {
              id
              quantity
              lineItem {
                id
                title
              }
            }
          }
        }
      }
    }
  }
`);

/** Позиції замовлення з варіантами — щоб зібрати з них рядки кошика («Повторити замовлення»). */
export const ORDER_REORDER_QUERY = gql(`
  query AccountOrderReorder($id: ID!) {
    order(id: $id) {
      id
      name
      lineItems(first: 100) {
        nodes {
          id
          title
          variantTitle
          quantity
          variantId
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`);
