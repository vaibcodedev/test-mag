import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { ProductCard, type ProductCardData } from "~/components/product/product-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";

/** Стільки карток уміщається в рядок на великому екрані: більше — з'являються стрілки. */
const VISIBLE_COUNT = 4;

export type RelatedProductsProps = Omit<SectionProps, "id" | "children" | "title"> & {
  id?: string;
  title?: string;
  products: readonly ProductCardData[];
  onAddToCart?: (product: ProductCardData) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/**
 * «Схожі товари»: карусель. На телефоні рядок гортається пальцем, на великому екрані
 * в ряд стає чотири картки. Без товарів не показується.
 */
export function RelatedProducts({
  id = "related-products",
  title = "Схожі товари",
  products,
  onAddToCart,
  addingHandle,
  ...props
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <Section id={id} {...props}>
      <SectionHeader sectionId={id} title={title} />
      <Carousel
        aria-label={`${title}: добірка`}
        opts={{ align: "start", containScroll: "trimSnaps" }}
      >
        {/* py-2: місце для hover-підйому картки всередині обрізаної області каруселі. */}
        <CarouselContent className="-ms-3 py-2">
          {products.map((product, index) => (
            <CarouselItem
              key={product.handle}
              aria-label={`${index + 1} з ${products.length}`}
              className="basis-64 ps-3 md:basis-1/2 lg:basis-1/4"
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
                adding={addingHandle === product.handle}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {products.length > VISIBLE_COUNT ? (
          <div className="mt-4 hidden justify-end gap-2 md:flex">
            <CarouselPrevious variant="surface" />
            <CarouselNext variant="surface" />
          </div>
        ) : null}
      </Carousel>
    </Section>
  );
}
