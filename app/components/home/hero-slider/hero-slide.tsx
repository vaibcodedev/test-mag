import { Scale, ShoppingCart, Truck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { ColorSwatches } from "~/components/product/color-swatches";
import { DEFAULT_INSTALLMENT_MONTHS } from "~/components/product/installment-chip";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CarouselItem, useCarousel } from "~/components/ui/carousel";
import { Price } from "~/components/ui/price";
import { ShopImage } from "~/components/ui/shop-image";
import { formatPrice, installmentPayment } from "~/lib/format";

import type { HomeBanner } from "./hero-slider.types";

const IMAGE_FALLBACK_SIZE = 960;
/** Банер займає близько двох третин контейнера, фото — близько половини банера. */
const IMAGE_SIZES = "(min-width: 64rem) 32vw, 100vw";

type HeroSlideProps = {
  banner: HomeBanner;
  /** Номер слайда з нуля. */
  index: number;
  count: number;
  /** Перший слайд: фото без lazy. */
  priority?: boolean;
};

/** Заголовок із виділеним словом: «iPhone 17 <lime>Pro</lime>». */
function BannerTitle({ title, accent }: Pick<HomeBanner, "title" | "accent">) {
  const start = accent ? title.indexOf(accent) : -1;
  if (!accent || start === -1) return <>{title}</>;

  return (
    <>
      {title.slice(0, start)}
      <span className="text-lime">{accent}</span>
      {title.slice(start + accent.length)}
    </>
  );
}

function DeliveryPlate({
  text,
  onPhoto = false,
  className,
}: {
  text: string;
  /** Плашка поверх фото: біла. Без фото — напівпрозора на ink. */
  onPhoto?: boolean;
  className?: string;
}) {
  return (
    <Badge variant={onPhoto ? "chip-surface" : "chip-on-dark"} className={className}>
      <Truck aria-hidden="true" strokeWidth={2} />
      {text}
    </Badge>
  );
}

export function HeroSlide({ banner, index, count, priority = false }: HeroSlideProps) {
  const { selectedIndex } = useCarousel();
  const active = index === selectedIndex;

  const colors = banner.colors ?? [];
  const [colorName, setColorName] = useState(colors[0]?.name);
  const color = colors.find((item) => item.name === colorName) ?? colors[0];

  const image = color?.image ?? banner.image;
  const href = color?.href ?? banner.href;
  const months = banner.installmentMonths ?? DEFAULT_INSTALLMENT_MONTHS;
  const payment = banner.price ? installmentPayment(banner.price, months) : null;

  return (
    <CarouselItem
      aria-label={`Слайд ${index + 1} з ${count}`}
      aria-hidden={active ? undefined : true}
      inert={!active}
      className="flex"
    >
      <div
        data-slot="hero-slide"
        data-active={active}
        className="flex min-w-0 flex-1 flex-col gap-5"
      >
        {banner.label ? (
          <p className="inline-flex items-center gap-2 text-small font-semibold text-lime">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-lime" />
            {banner.label}
          </p>
        ) : null}

        <h2 className="text-display text-balance text-surface">
          <BannerTitle title={banner.title} accent={banner.accent} />
        </h2>

        <div className="grid flex-1 gap-6 @2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex min-w-0 flex-col items-start gap-5">
            {banner.subtitle ? (
              <p className="max-w-md text-body text-on-ink-muted">{banner.subtitle}</p>
            ) : null}

            {banner.specs?.length ? (
              <ul aria-label="Характеристики" className="flex flex-wrap gap-2">
                {banner.specs.map((spec) => (
                  <li key={spec}>
                    <Badge variant="chip-on-dark">{spec}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}

            {color ? (
              <div className="flex flex-wrap items-center gap-x-3">
                <ColorSwatches
                  colors={colors}
                  value={color.name}
                  onChange={setColorName}
                  label={`Колір ${banner.title}`}
                  onDark
                  className="-ms-2"
                />
                <p className="text-small text-on-ink-muted">{color.name}</p>
              </div>
            ) : null}

            <div className="mt-auto flex flex-col gap-5 pt-1">
              {banner.price ? (
                <div className="flex flex-col gap-1">
                  <Price
                    price={banner.price}
                    size="hero"
                    from={banner.priceFrom ?? true}
                    onDark
                    showSavings={false}
                  />
                  {payment ? (
                    <p className="text-small text-on-ink-muted tabular-nums">
                      або {formatPrice(payment)} × {months} міс.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="lime" size="lg">
                  <Link to={href} prefetch="intent">
                    <ShoppingCart aria-hidden="true" strokeWidth={2} />
                    Купити
                    <span className="sr-only">: {banner.title}</span>
                  </Link>
                </Button>
                {banner.compareHref ? (
                  <Button asChild variant="on-dark" size="lg">
                    <Link to={banner.compareHref} prefetch="intent">
                      <Scale aria-hidden="true" strokeWidth={2} />
                      Порівняти
                      <span className="sr-only">: {banner.title}</span>
                    </Link>
                  </Button>
                ) : null}
              </div>

              {banner.delivery && !image ? <DeliveryPlate text={banner.delivery} /> : null}
            </div>
          </div>

          {image ? (
            <div className="relative order-first min-h-56 overflow-hidden rounded-lg bg-on-ink-10 @2xl:order-none @2xl:min-h-80">
              <ShopImage
                src={image.url}
                alt={image.altText ?? ""}
                width={image.width ?? IMAGE_FALLBACK_SIZE}
                height={image.height ?? IMAGE_FALLBACK_SIZE}
                sizes={IMAGE_SIZES}
                priority={priority}
                className="absolute inset-0 size-full object-cover"
              />
              {banner.delivery ? (
                <DeliveryPlate
                  text={banner.delivery}
                  onPhoto
                  className="absolute start-3 bottom-3"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </CarouselItem>
  );
}
