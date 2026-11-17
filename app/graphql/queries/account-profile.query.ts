import { gql } from "@shopify/hydrogen/customer-account";

/**
 * Профіль покупця: читання і зміна. Запити дрібні й окремі: якщо живий API не віддасть стан
 * розсилки, сторінка профілю лишиться робочою без цього блоку.
 *
 * Кожну операцію звірено з довідником Customer Account API 2026-10 (shopify-dev MCP, validate).
 * `CustomerUpdateInput` приймає лише `firstName` і `lastName`: телефон облікового запису через
 * API не змінюється, тому в профілі його немає.
 */
export const PROFILE_QUERY = gql(`
  query AccountProfile {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
`);

/** Стан підписки на листи магазину. Другорядний запит. */
export const PROFILE_MARKETING_QUERY = gql(`
  query AccountProfileMarketing {
    customer {
      emailAddress {
        marketingState
      }
    }
  }
`);

export const PROFILE_UPDATE_MUTATION = gql(`
  mutation AccountProfileUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        firstName
        lastName
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`);

export const MARKETING_SUBSCRIBE_MUTATION = gql(`
  mutation AccountMarketingSubscribe {
    customerEmailMarketingSubscribe {
      emailAddress {
        marketingState
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`);

export const MARKETING_UNSUBSCRIBE_MUTATION = gql(`
  mutation AccountMarketingUnsubscribe {
    customerEmailMarketingUnsubscribe {
      emailAddress {
        marketingState
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`);
