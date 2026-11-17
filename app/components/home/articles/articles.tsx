import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "~/components/ui/card";
import { ShopImage } from "~/components/ui/shop-image";
import { calendarDate, formatDate } from "~/lib/format";

/** У секції показуємо рівно три статті. */
const VISIBLE_ARTICLES = 3;
const IMAGE_FALLBACK_WIDTH = 960;
const IMAGE_FALLBACK_HEIGHT = 600;
const IMAGE_SIZES = "(min-width: 48rem) 33vw, 100vw";

export type ArticleImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export type ArticleCardData = {
  handle: string;
  title: string;
  excerpt: string;
  image: ArticleImage | null;
  /** Дата публікації в ISO 8601. */
  publishedAt: string;
};

export type ArticlesContent = {
  title: string;
  description?: string;
  /** Посилання на весь блог. */
  link: { title: string; to: string };
  /** Підпис біля стрілки в картці: «Читати». */
  readMore: string;
};

export type ArticlesProps = Omit<SectionProps, "id" | "children" | "content"> & {
  id?: string;
  content: ArticlesContent;
  /** Статті блогу; секція бере перші три. */
  articles: ArticleCardData[];
};

/** Три свіжі статті з блогу. */
export function Articles({ id = "articles", content, articles, ...props }: ArticlesProps) {
  return (
    <Section id={id} {...props}>
      <SectionHeader
        sectionId={id}
        title={content.title}
        description={content.description}
        link={content.link}
      />

      <ul role="list" className="grid gap-4 md:grid-cols-3">
        {articles.slice(0, VISIBLE_ARTICLES).map((article) => {
          const published = calendarDate(article.publishedAt);

          return (
            <li key={article.handle} className="min-w-0">
              <Card asChild interactive padding="none" className="h-full overflow-hidden">
                <article>
                  <AspectRatio ratio={16 / 10} className="overflow-hidden bg-photo">
                    {article.image ? (
                      <ShopImage
                        src={article.image.url}
                        alt={article.image.altText ?? ""}
                        width={article.image.width ?? IMAGE_FALLBACK_WIDTH}
                        height={article.image.height ?? IMAGE_FALLBACK_HEIGHT}
                        sizes={IMAGE_SIZES}
                        className="size-full lift-photo object-cover"
                      />
                    ) : null}
                  </AspectRatio>

                  <CardContent className="flex flex-1 flex-col gap-3 p-6">
                    {published ? (
                      <time
                        dateTime={published.dateTime}
                        className="text-small text-muted-foreground"
                      >
                        {formatDate(published.date)}
                      </time>
                    ) : null}
                    <CardTitle asChild>
                      <h3 className="text-h3 wrap-break-word">
                        <Link
                          viewTransition
                          to={`/blogs/blog/${article.handle}`}
                          prefetch="intent"
                          className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:shadow-focus"
                        >
                          {article.title}
                        </Link>
                      </h3>
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-body">
                      {article.excerpt}
                    </CardDescription>
                    {/* Уся картка — посилання із заголовка; це лише видима підказка. */}
                    <CardFooter>
                      <Button asChild variant="link" className="min-h-11">
                        <span aria-hidden="true">
                          {content.readMore}
                          <ArrowRight
                            strokeWidth={2}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      </Button>
                    </CardFooter>
                  </CardContent>
                </article>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
