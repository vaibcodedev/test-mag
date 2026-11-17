import { useId, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Breadcrumbs } from "~/components/layout/breadcrumbs";
import { Container } from "~/components/layout/container";
import { CompareButton } from "~/components/product/compare-button";
import type { ProductCardData } from "~/components/product/product-card";
import { ProductDetails } from "~/components/product/product-details";
import { ProductForm, useProductBuyForm } from "~/components/product/product-form";
import { ProductGallery } from "~/components/product/product-gallery";
import { ProductInfo, ProductTrust } from "~/components/product/product-info";
import { RelatedProducts } from "~/components/product/related-products";
import { ShopPay } from "~/components/product/shop-pay";
import { StickyBuyBar, useStickyBuyBar } from "~/components/product/sticky-buy-bar";
import { VariantPicker } from "~/components/product/variant-picker";
import { WishlistButton } from "~/components/product/wishlist-button";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useAddToCart } from "~/hooks/use-add-to-cart";
import { toggleCompare, useIsCompared } from "~/hooks/use-compare";
import { compareCategoryOf } from "~/lib/compare/spec-schema";
import { useTransitionDetail } from "~/lib/view-transition";
import { toggleWishlist, useIsWishlisted } from "~/hooks/use-wishlist";
import { ProductProvider } from "~/lib/product";
import {
  productBreadcrumbs,
  productGalleryMedia,
  productVariantUrl,
  toProductDetails,
  type ProductPageData,
} from "~/lib/shopify/product";

import { ProductViewTracker } from "./product-view-tracker";

export type ProductPageProps = {
  product: ProductPageData;
  /** «Схожі товари». */
  related: readonly ProductCardData[];
};

function ProductPageContent({ product, related }: ProductPageProps) {
  const formId = useId();
  const buy = useProductBuyForm(product, formId);
  const { addToCart, addingHandle } = useAddToCart();
  const wishlisted = useIsWishlisted(product.handle);
  const compared = useIsCompared(product.handle);
  const transitionDetail = useTransitionDetail("product", product.handle);
  const compareCategory = compareCategoryOf(product.productType)?.key ?? null;

  // Елементи зберігаються у стані, щоб спостерігач помітив появу й зникнення кнопки.
  const [buyButton, setBuyButton] = useState<HTMLButtonElement | null>(null);
  const [pageEnd, setPageEnd] = useState<HTMLDivElement | null>(null);
  const stickyVisible = useStickyBuyBar(buyButton, pageEnd);

  const variant = buy.selectedVariant;
  const details = useMemo(() => toProductDetails(product), [product]);
  const media = useMemo(() => productGalleryMedia(product, variant), [product, variant]);
  const breadcrumbs = useMemo(() => productBreadcrumbs(product), [product]);

  // Ціну й наявність завжди віддає сервер: вибраного варіанта або найдешевшого.
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = variant?.compareAtPrice ?? null;
  const available = variant ? variant.availableForSale : product.availableForSale;
  const canBuy = buy.state === "available";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex flex-1 flex-col gap-section pt-2 outline-none"
      // Галерея (data-vt-detail) бере звідси назву переходу: у неї розкривається картка товару.
      {...transitionDetail}
    >
      <div className="flex flex-col gap-4">
        <Container className="flex flex-col gap-2">
          <Breadcrumbs items={breadcrumbs} />

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-6">
            <div className="relative min-w-0 lg:sticky lg:top-22">
              <ProductGallery media={media} title={product.title} />
              <div className="absolute end-3 top-3 z-10 flex flex-col gap-2">
                <WishlistButton
                  productTitle={product.title}
                  active={wishlisted}
                  onClick={() => toggleWishlist(product.handle)}
                />
                {compareCategory ? (
                  <CompareButton
                    productTitle={product.title}
                    active={compared}
                    onClick={() => toggleCompare(product.handle, compareCategory)}
                  />
                ) : null}
              </div>
            </div>

            <Card className="gap-5 lg:sticky lg:top-22">
              <ProductInfo
                title={product.title}
                price={price}
                compareAt={compareAt}
                available={available}
                delivery={available ? "доставимо завтра" : null}
                badge={details.badge}
                rating={details.rating}
                installmentMonths={details.installmentMonths}
                shortSpecs={details.shortSpecs}
                used={details.used}
              >
                <VariantPicker options={buy.pickerOptions} />
              </ProductInfo>

              <ProductForm
                {...buy.form}
                fields={buy.fields}
                state={buy.state}
                pending={buy.pending}
                errors={buy.errors}
                submitRef={setBuyButton}
              >
                {variant && canBuy ? (
                  <ShopPay
                    variants={[{ id: variant.id, quantity: 1 }]}
                    disabled={buy.pending}
                    label="Купити через Shop Pay"
                  />
                ) : null}
              </ProductForm>

              <Separator />
              <ProductTrust used={Boolean(details.used)} />
            </Card>
          </div>
        </Container>

        <ProductDetails
          descriptionHtml={product.descriptionHtml}
          description={product.description}
          specs={details.shortSpecs}
          used={Boolean(details.used)}
        />
      </div>

      <RelatedProducts products={related} onAddToCart={addToCart} addingHandle={addingHandle} />

      {/* Позначка кінця сторінки товару: біля неї липка панель ховається й не накриває підвал. */}
      <div
        ref={setPageEnd}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
      />

      <StickyBuyBar
        visible={stickyVisible && canBuy}
        title={product.title}
        price={price}
        compareAt={compareAt}
        formId={formId}
        submit={buy.fields.submit}
        pending={buy.pending}
      />
    </main>
  );
}

/**
 * Сторінка товару: галерея, колонка купівлі, опис, умови магазину та схожі товари.
 *
 * Вибір варіанта синхронізує з адресою ProductProvider (onSelect): запис в історії замінюється,
 * прокрутка лишається на місці, а параметри, що не стосуються опцій, зберігаються.
 */
export function ProductPage({ product, related }: ProductPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        void navigate(
          productVariantUrl(
            product,
            result.selectedOptions,
            result.selectedVariant?.product?.handle,
            new URLSearchParams(location.search),
          ),
          {
            replace: true,
            preventScrollReset: true,
            // Варіант уже є в локальному кеші: повторний запит loader не потрібен.
            ...(result.status === "resolved" ? { defaultShouldRevalidate: false } : {}),
          },
        );
      }}
    >
      <ProductViewTracker product={product} />
      <ProductPageContent product={product} related={related} />
    </ProductProvider>
  );
}
