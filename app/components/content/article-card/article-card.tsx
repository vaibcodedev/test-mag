import { ArrowRight } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { PublishedDate } from "~/components/content/published-date";
import type { ArticleCardData } from "~/components/home/articles";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "~/components/ui/card";
import { ShopImage } from "~/components/ui/shop-image";
import { cn } from "~/lib/utils";

const IMAGE_FALLBACK_WIDTH = 960;
const IMAGE_FALLBACK_HEIGHT = 600;
const IMAGE_SIZES = "(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw";
const IMAGE_RATIO = 16 / 10;

export type ArticleCardProps = Omit<ComponentProps<"article">, "children"> & {
  article: ArticleCardData;
  /** Handle блогу, якому належить стаття: з нього будується адреса. */
  blogHandle?: string;
  /** Рівень заголовка: h2 у списку блогу, h3 усередині секції з власним h2. */
  headingLevel?: "h2" | "h3";
  /** Підпис біля стрілки. */
  readMore?: string;
  /** Перша картка першого екрана: фото без lazy. */
  priority?: boolean;
};

/** Картка статті блогу: фото, дата, заголовок-посилання та уривок. Клікабельна вся картка. */
export function ArticleCard({
  article,
  blogHandle = "blog",
  headingLevel: Heading = "h3",
  readMore = "Читати",
  priority = false,
  className,
  ...props
}: ArticleCardProps) {
  return (
    <Card asChild interactive padding="none" className={cn("h-full overflow-hidden", className)}>
      <article data-slot="article-card" {...props}>
        <AspectRatio ratio={IMAGE_RATIO} className="overflow-hidden bg-photo">
          {article.image ? (
            <ShopImage
              src={article.image.url}
              alt={article.image.altText ?? ""}
              width={article.image.width ?? IMAGE_FALLBACK_WIDTH}
              height={article.image.height ?? IMAGE_FALLBACK_HEIGHT}
              sizes={IMAGE_SIZES}
              priority={priority}
              className="size-full lift-photo object-cover"
            />
          ) : null}
        </AspectRatio>

        <CardContent className="flex flex-1 flex-col gap-3 px-6 pt-6">
          <PublishedDate value={article.publishedAt} className="text-small text-muted-foreground" />
          <CardTitle asChild className="text-h3 wrap-break-word">
            <Heading>
              {/* Псевдоелемент розтягує посилання на всю картку; фокус обводить її цілком. */}
              <Link
                to={`/blogs/${blogHandle}/${article.handle}`}
                prefetch="intent"
                className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:shadow-focus"
              >
                {article.title}
              </Link>
            </Heading>
          </CardTitle>
          {article.excerpt ? (
            <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
          ) : null}
        </CardContent>

        <CardFooter className="px-6 pt-1 pb-4">
          <span aria-hidden="true" className={cn(buttonVariants({ variant: "link" }), "min-h-11")}>
            {readMore}
            <ArrowRight
              strokeWidth={2}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </CardFooter>
      </article>
    </Card>
  );
}
