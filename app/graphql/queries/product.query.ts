import { gql } from "@shopify/hydrogen";

import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments/product-card.fragment";

/** Варіант товару: ціна, наявність, фото й опції для форми купівлі. */
const PRODUCT_VARIANT_FRAGMENT = gql(`
  fragment ProductVariantFields on ProductVariant {
    id
    title
    sku
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    image {
      id
      url
      altText
      width
      height
    }
    product {
      title
      handle
    }
  }
`);

/**
 * Сторінка товару. Поля encodedVariant*, options, selectedOrFirstAvailableVariant
 * та adjacentVariants потрібні формі товару Hydrogen (useProductForm).
 */
export const PRODUCT_QUERY = gql(
  `
    query ProductPage(
      $handle: String!
      $selectedOptions: [SelectedOptionInput!]!
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        description
        descriptionHtml
        availableForSale
        requiresSellingPlan
        encodedVariantExistence
        encodedVariantAvailability
        seo {
          title
          description
        }
        featuredImage {
          id
          url
          altText
          width
          height
        }
        images(first: 10) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        collections(first: 1) {
          nodes {
            handle
            title
          }
        }
        options {
          name
          optionValues {
            name
            firstSelectableVariant {
              ...ProductVariantFields
            }
            swatch {
              color
            }
          }
        }
        selectedOrFirstAvailableVariant(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
        adjacentVariants(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
        badge: metafield(namespace: "custom", key: "badge") {
          value
        }
        installmentMonths: metafield(namespace: "custom", key: "installment_months") {
          value
        }
        shortSpecs: metafield(namespace: "custom", key: "short_specs") {
          value
        }
        colorSwatches: metafield(namespace: "custom", key: "color_swatches") {
          value
        }
        conditionGrade: metafield(namespace: "custom", key: "condition_grade") {
          value
        }
        batteryHealth: metafield(namespace: "custom", key: "battery_health") {
          value
        }
      }
    }
  `,
  [PRODUCT_VARIANT_FRAGMENT],
);

/** «Схожі товари»: рекомендації Shopify для товару. */
export const PRODUCT_RECOMMENDATIONS_QUERY = gql(
  `
    query ProductRecommendations($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      productRecommendations(productHandle: $handle, intent: RELATED) {
        ...ProductCardFields
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT],
);
