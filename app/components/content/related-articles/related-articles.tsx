import { useId, type ComponentProps } from "react";

import { ArticleCard } from "~/components/content/article-card";
import type { ArticleCardData } from "~/components/home/articles";
import { cn } from "~/lib/utils";

export type RelatedArticlesProps = Omit<ComponentProps<"section">, "title" | "children"> & {
  articles: readonly ArticleCardData[];
  blogHandle: string;
  title?: string;
};

/** «Читайте також»: до трьох інших статей блогу. Без статей секція не рендериться. */
export function RelatedArticles({
  articles,
  blogHandle,
  title = "Читайте також",
  className,
  ...props
}: RelatedArticlesProps) {
  const titleId = useId();
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby={titleId}
      data-slot="related-articles"
      className={cn("flex flex-col gap-8", className)}
      {...props}
    >
      <h2 id={titleId} className="text-h2 text-ink">
        {title}
      </h2>
      <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.handle} className="min-w-0">
            <ArticleCard article={article} blogHandle={blogHandle} headingLevel="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
