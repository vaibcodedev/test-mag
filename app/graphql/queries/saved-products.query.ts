import { gql } from "@shopify/hydrogen";

import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments/product-card.fragment";

/** Картка товару та характеристики для таблиці порівняння. */
export const SAVED_PRODUCT_FRAGMENT = gql(
  `
    fragment SavedProductFields on Product {
      ...ProductCardFields
      vendor
      productType
      options(first: 10) {
        name
        optionValues {
          name
        }
      }
      shortSpecs: metafield(namespace: "custom", key: "short_specs") {
        value
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT],
);

/**
 * Скільки товарів уміщує один запит: стільки ж псевдонімів p0…pN у документі нижче.
 * Більше дванадцяти не можна: на довшому документі виведення типів gql() впирається в ліміт TypeScript (TS2589).
 */
export const SAVED_PRODUCTS_SLOTS = 12;

/**
 * Товари за списком handle одним запитом.
 *
 * Storefront API не шукає товари за handle (products(query:) такого фільтра не має),
 * тому кожен товар — окреме поле product(handle:) під псевдонімом. Документ статичний,
 * щоб gql() його типізував і перевіряв: слот N вмикається змінною $iN, handle лежить у $hN.
 */
export const SAVED_PRODUCTS_QUERY = gql(
  `
    query SavedProducts(
      $h0: String = ""
      $i0: Boolean = false
      $h1: String = ""
      $i1: Boolean = false
      $h2: String = ""
      $i2: Boolean = false
      $h3: String = ""
      $i3: Boolean = false
      $h4: String = ""
      $i4: Boolean = false
      $h5: String = ""
      $i5: Boolean = false
      $h6: String = ""
      $i6: Boolean = false
      $h7: String = ""
      $i7: Boolean = false
      $h8: String = ""
      $i8: Boolean = false
      $h9: String = ""
      $i9: Boolean = false
      $h10: String = ""
      $i10: Boolean = false
      $h11: String = ""
      $i11: Boolean = false
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      p0: product(handle: $h0) @include(if: $i0) {
        ...SavedProductFields
      }
      p1: product(handle: $h1) @include(if: $i1) {
        ...SavedProductFields
      }
      p2: product(handle: $h2) @include(if: $i2) {
        ...SavedProductFields
      }
      p3: product(handle: $h3) @include(if: $i3) {
        ...SavedProductFields
      }
      p4: product(handle: $h4) @include(if: $i4) {
        ...SavedProductFields
      }
      p5: product(handle: $h5) @include(if: $i5) {
        ...SavedProductFields
      }
      p6: product(handle: $h6) @include(if: $i6) {
        ...SavedProductFields
      }
      p7: product(handle: $h7) @include(if: $i7) {
        ...SavedProductFields
      }
      p8: product(handle: $h8) @include(if: $i8) {
        ...SavedProductFields
      }
      p9: product(handle: $h9) @include(if: $i9) {
        ...SavedProductFields
      }
      p10: product(handle: $h10) @include(if: $i10) {
        ...SavedProductFields
      }
      p11: product(handle: $h11) @include(if: $i11) {
        ...SavedProductFields
      }
    }
  `,
  [SAVED_PRODUCT_FRAGMENT],
);
