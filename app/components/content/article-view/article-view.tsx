import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { ArticleHeader } from "~/components/content/article-header";
import { RelatedArticles } from "~/components/content/related-articles";
import { ContentBodyView } from "~/components/content/rich-text";
import type { ArticleCardData, ArticleImage } from "~/components/home/articles";
import { Breadcrumbs, type BreadcrumbItem } from "~/components/layout/breadcrumbs";
import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { ContentBody } from "~/lib/content/pages";

export type ArticleViewProps = {
  breadcrumbs: readonly BreadcrumbItem[];
  blog: { handle: string; title: string };
  article: {
    title: string;
    publishedAt: string;
    readingMinutes?: number | null;
    authorName?: string | null;
    image?: ArticleImage | null;
    body: ContentBody;
  };
  /** Інші статті блогу для «Читайте також». */
  related: readonly ArticleCardData[];
};

/** Сторінка статті: крихти, шапка з фото, текст, повернення до блогу та «Читайте також». */
export function ArticleView({ breadcrumbs, blog, article, related }: ArticleViewProps) {
  return (
    <Container data-slot="article-view" className="flex flex-col gap-section">
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Breadcrumbs items={breadcrumbs} />
        <ArticleHeader
          title={article.title}
          publishedAt={article.publishedAt}
          readingMinutes={article.readingMinutes}
          authorName={article.authorName}
          image={article.image}
        />
        <Card padding="none" className="p-6 md:p-10">
          <CardContent>
            <ContentBodyView body={article.body} />
          </CardContent>
        </Card>
        <Button asChild variant="link" className="min-h-11 self-start">
          <Link to={`/blogs/${blog.handle}`} prefetch="intent">
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            Усі статті блогу
          </Link>
        </Button>
      </article>

      <RelatedArticles articles={related} blogHandle={blog.handle} />
    </Container>
  );
}
