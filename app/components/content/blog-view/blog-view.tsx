import { Newspaper } from "lucide-react";
import { Link } from "react-router";

import { ArticleCard } from "~/components/content/article-card";
import type { ArticleCardData } from "~/components/home/articles";
import { Breadcrumbs, type BreadcrumbItem } from "~/components/layout/breadcrumbs";
import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

export type BlogViewProps = {
  breadcrumbs: readonly BreadcrumbItem[];
  /** Єдиний h1 сторінки. */
  title: string;
  description?: string | null;
  blogHandle: string;
  articles: readonly ArticleCardData[];
  /** Адреси сусідніх сторінок списку; звичайні посилання, працюють без JavaScript. */
  newerHref?: string | null;
  olderHref?: string | null;
};

/** Сторінка блогу: заголовок, сітка карток статей і перехід між сторінками списку. */
export function BlogView({
  breadcrumbs,
  title,
  description,
  blogHandle,
  articles,
  newerHref,
  olderHref,
}: BlogViewProps) {
  return (
    <Container data-slot="blog-view" className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-h2 wrap-anywhere text-ink">{title}</h1>
        {description ? <p className="max-w-3xl text-body text-ink-2">{description}</p> : null}
      </header>

      {articles.length > 0 ? (
        <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <li key={article.handle} className="min-w-0">
              <ArticleCard
                article={article}
                blogHandle={blogHandle}
                headingLevel="h2"
                priority={index === 0}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <Newspaper strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle as="h2">Тут поки немає статей</EmptyTitle>
            <EmptyDescription>
              Скоро розповімо, як обрати техніку Apple й перевірити її перед покупкою, а тим часом
              зазирніть у каталог.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/collections" prefetch="intent">
                Перейти до каталогу
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {newerHref || olderHref ? (
        <Pagination aria-label="Сторінки блогу">
          <PaginationContent className="w-full justify-between">
            {newerHref ? (
              <PaginationItem>
                <PaginationPrevious
                  asChild
                  showText="always"
                  text="Новіші статті"
                  aria-label="Новіші статті"
                >
                  <Link to={newerHref} />
                </PaginationPrevious>
              </PaginationItem>
            ) : null}
            {olderHref ? (
              <PaginationItem className="ms-auto">
                <PaginationNext
                  asChild
                  showText="always"
                  text="Старіші статті"
                  aria-label="Старіші статті"
                >
                  <Link to={olderHref} />
                </PaginationNext>
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </Container>
  );
}
