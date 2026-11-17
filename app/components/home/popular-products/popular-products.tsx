import { Link } from "react-router";

import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { ProductCard, type ProductCardData } from "~/components/product/product-card";
import { tabsListVariants, tabsTriggerVariants } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

export type PopularProductsTab = {
  title: string;
  /** Колекція, куди веде вкладка: «/collections/new». */
  to: string;
};

export type PopularProductsContent = {
  title: string;
  description?: string;
  /** Назва навігації для скринрідера. */
  tabsLabel: string;
};

export type PopularProductsProps = Omit<SectionProps, "id" | "children" | "content"> & {
  id?: string;
  content: PopularProductsContent;
  /** Товари першої вкладки: вони є в HTML одразу. */
  products: ProductCardData[];
  /** Перша вкладка активна, решта — звичайні посилання на колекції. */
  tabs: PopularProductsTab[];
  onAddToCart?: (product: ProductCardData) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/**
 * «Популярні товари». Товари першої вкладки рендеряться на сервері, інші вкладки —
 * посилання на колекції у вигляді вкладок, тому секція працює без JavaScript.
 */
export function PopularProducts({
  id = "popular-products",
  content,
  products,
  tabs,
  onAddToCart,
  addingHandle,
  ...props
}: PopularProductsProps) {
  return (
    <Section id={id} {...props}>
      <SectionHeader
        sectionId={id}
        title={content.title}
        description={content.description}
        className="mb-6"
      />

      {tabs.length > 0 ? (
        <nav
          aria-label={content.tabsLabel}
          className="-mx-gutter mb-6 overflow-x-auto px-gutter py-2"
        >
          <ul role="list" className={cn(tabsListVariants({ variant: "pills" }), "max-w-none")}>
            {tabs.map((tab, index) => {
              const active = index === 0;

              return (
                <li key={tab.to} className="shrink-0">
                  <Link
                    viewTransition
                    to={tab.to}
                    prefetch="intent"
                    aria-current={active ? "page" : undefined}
                    data-active={active ? "" : undefined}
                    className={tabsTriggerVariants({ variant: "pills" })}
                  >
                    {tab.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <ul
        role="list"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      >
        {products.map((product) => (
          <li key={product.handle} className="min-w-0">
            <ProductCard
              product={product}
              onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
              adding={addingHandle === product.handle}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
