import { Check } from "lucide-react";
import { Link } from "react-router";

import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import type { ProductCardImage } from "~/components/product/product-card";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia } from "~/components/ui/item";
import { Price } from "~/components/ui/price";
import { Separator } from "~/components/ui/separator";
import { ShopImage } from "~/components/ui/shop-image";
import type { Money } from "~/lib/format";

export type IphoneLineupModel = {
  /** Назва моделі: «iPhone 17 Pro». */
  title: string;
  to: string;
  image: ProductCardImage | null;
  /** Ціна найдешевшої конфігурації: показується як «від N ₴». */
  price: Money;
  /** Три ключові відмінності моделі. */
  highlights: readonly string[];
};

export type IphoneLineupProps = Omit<SectionProps, "id" | "children"> & {
  models: readonly IphoneLineupModel[];
  id?: string;
  title?: string;
  description?: string;
  /** Посилання «Усі iPhone» праворуч від заголовка; null його прибирає. */
  link?: { title: string; to: string } | null;
};

const IMAGE_FALLBACK_SIZE = 600;
const IMAGE_SIZES = "(min-width: 80rem) 15vw, (min-width: 48rem) 30vw, 60vw";
const DEFAULT_LINK = { title: "Усі iPhone", to: "/collections/iphone" };

/** «Який iPhone купити»: моделі поруч — фото, ціна і три відмінності кожної. */
export function IphoneLineup({
  models,
  id = "iphone-lineup",
  title = "Який iPhone купити у 2026 році",
  description = "Шість актуальних моделей поруч: чим відрізняються і скільки коштують.",
  link = DEFAULT_LINK,
  ...props
}: IphoneLineupProps) {
  if (models.length === 0) return null;

  return (
    <Section id={id} data-slot="iphone-lineup" {...props}>
      <SectionHeader
        sectionId={id}
        title={title}
        description={description}
        link={link ?? undefined}
      />
      {/*
        Нативна горизонтальна прокрутка зі snap, з xl — сітка на шість колонок.
        Вертикальні поля області прокрутки лишають місце для hover-підйому й тіні карток.
      */}
      <ul className="-mx-gutter -my-4 flex snap-x scroll-px-gutter gap-3 overflow-x-auto px-gutter py-4 md:gap-4 xl:mx-0 xl:grid xl:grid-cols-6 xl:overflow-visible xl:px-0">
        {models.map((model) => (
          <li key={model.to} className="w-56 min-w-0 shrink-0 snap-start xl:w-auto">
            <Card asChild interactive padding="sm" className="h-full p-3">
              <article>
                <AspectRatio ratio={1} className="overflow-hidden rounded-md bg-photo">
                  {model.image ? (
                    <ShopImage
                      src={model.image.url}
                      alt={model.image.altText ?? ""}
                      width={model.image.width ?? IMAGE_FALLBACK_SIZE}
                      height={model.image.height ?? IMAGE_FALLBACK_SIZE}
                      sizes={IMAGE_SIZES}
                      className="size-full lift-photo object-cover"
                    />
                  ) : null}
                </AspectRatio>
                <CardContent className="flex flex-1 flex-col gap-3 px-1 pb-1">
                  <CardTitle asChild>
                    <h3>
                      <Link
                        to={model.to}
                        prefetch="intent"
                        className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:shadow-focus"
                      >
                        {model.title}
                      </Link>
                    </h3>
                  </CardTitle>
                  <Price price={model.price} from />
                  <Separator />
                  <ItemGroup asChild>
                    <ul aria-label={`Особливості ${model.title}`}>
                      {model.highlights.map((highlight) => (
                        <li key={highlight}>
                          <Item size="none" className="flex-nowrap gap-2">
                            <ItemMedia>
                              <Check aria-hidden="true" strokeWidth={2} className="size-4" />
                            </ItemMedia>
                            <ItemContent>
                              <ItemDescription>{highlight}</ItemDescription>
                            </ItemContent>
                          </Item>
                        </li>
                      ))}
                    </ul>
                  </ItemGroup>
                </CardContent>
              </article>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
