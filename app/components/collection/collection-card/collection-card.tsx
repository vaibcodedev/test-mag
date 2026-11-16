import { ArrowRight } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardDescription, CardTitle } from "~/components/ui/card";
import { ShopImage } from "~/components/ui/shop-image";
import { cn } from "~/lib/utils";

const IMAGE_FALLBACK_SIZE = 800;
const IMAGE_SIZES = "(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 90vw";

export type CollectionCardData = {
  handle: string;
  title: string;
  description?: string | null;
  image: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

export type CollectionCardProps = Omit<ComponentProps<"article">, "children"> & {
  collection: CollectionCardData;
  /** Картка на першому екрані: фото без lazy. */
  priority?: boolean;
  headingLevel?: "h2" | "h3";
};

/** Плитка колекції на сторінці «Каталог». Посилання в заголовку розтягнуте на всю плитку. */
export function CollectionCard({
  collection,
  priority = false,
  headingLevel: Heading = "h2",
  className,
  ...props
}: CollectionCardProps) {
  const { image } = collection;

  return (
    <Card asChild interactive padding="sm" className={cn("h-full gap-4", className)}>
      <article data-slot="collection-card" {...props}>
        <div className="overflow-hidden rounded-md bg-photo">
          <AspectRatio ratio={4 / 3}>
            {image ? (
              <ShopImage
                src={image.url}
                // Назва колекції стоїть поруч у заголовку, тож фото декоративне.
                alt=""
                width={image.width ?? IMAGE_FALLBACK_SIZE}
                height={image.height ?? IMAGE_FALLBACK_SIZE}
                sizes={IMAGE_SIZES}
                priority={priority}
                className="size-full lift-photo object-cover"
              />
            ) : null}
          </AspectRatio>
        </div>
        <CardContent className="flex flex-1 items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle asChild size="h3" className="wrap-anywhere">
              <Heading>
                <Link
                  to={`/collections/${collection.handle}`}
                  prefetch="intent"
                  className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:shadow-focus"
                >
                  {collection.title}
                </Link>
              </Heading>
            </CardTitle>
            {collection.description ? (
              <CardDescription className="line-clamp-2">{collection.description}</CardDescription>
            ) : null}
          </div>
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-page text-ink transition-[background-color,color,transform] group-focus-within:-rotate-45 group-focus-within:bg-blue group-focus-within:text-surface group-hover:-rotate-45 group-hover:bg-blue group-hover:text-surface"
          >
            <ArrowRight strokeWidth={2} className="size-5" />
          </span>
        </CardContent>
      </article>
    </Card>
  );
}
