import { AnalyticsEvent } from "@shopify/hydrogen";
import { useEffect } from "react";

import type { ProductPageData } from "~/lib/shopify/product";

/** Подія аналітики Shopify «товар переглянуто»: надсилається, коли приходять дані товару. */
export function ProductViewTracker({ product }: { product: ProductPageData }) {
  useEffect(() => {
    const selectedVariant = product.selectedOrFirstAvailableVariant;
    window.Shopify?.analytics?.publish(AnalyticsEvent.PRODUCT_VIEWED, {
      products: [
        {
          id: product.id,
          title: product.title,
          price: selectedVariant?.price ?? product.priceRange.minVariantPrice,
          vendor: product.vendor ?? "",
          variantId: selectedVariant?.id ?? product.id,
          variantTitle: selectedVariant?.title ?? product.title,
          quantity: 1,
          sku: selectedVariant?.sku,
        },
      ],
    });
  }, [product]);

  return null;
}
