import { Clock } from "lucide-react";
import type { ComponentProps } from "react";

import { PublishedDate } from "~/components/content/published-date";
import type { ArticleImage } from "~/components/home/articles";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import { ShopImage } from "~/components/ui/shop-image";
import { plural } from "~/lib/format";
import { cn } from "~/lib/utils";

const IMAGE_FALLBACK_WIDTH = 1440;
const IMAGE_FALLBACK_HEIGHT = 810;
/** Колонка статті не ширша за 56rem (max-w-4xl). */
const IMAGE_SIZES = "(min-width: 60rem) 56rem, 100vw";
const IMAGE_WIDTHS = [480, 720, 960, 1440, 1920] as const;

export type ArticleHeaderProps = Omit<ComponentProps<"header">, "title" | "children"> & {
  /** Єдиний h1 сторінки. */
  title: string;
  /** Дата публікації в ISO 8601. */
  publishedAt: string;
  /** Час читання у хвилинах. */
  readingMinutes?: number | null;
  authorName?: string | null;
  image?: ArticleImage | null;
};

/** «5 хвилин читання». */
export function readingTimeLabel(minutes: number): string {
  return `${minutes} ${plural(minutes, { one: "хвилина", few: "хвилини", many: "хвилин" })} читання`;
}

/** Шапка статті: h1, дата, час читання, автор і головне фото першого екрана. */
export function ArticleHeader({
  title,
  publishedAt,
  readingMinutes,
  authorName,
  image,
  className,
  ...props
}: ArticleHeaderProps) {
  return (
    <header data-slot="article-header" className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 wrap-anywhere text-ink">{title}</h1>
        <ul
          role="list"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-muted-foreground"
        >
          <li>
            <PublishedDate value={publishedAt} />
          </li>
          {readingMinutes ? (
            <li>
              <Badge variant="chip-surface">
                <Clock aria-hidden="true" strokeWidth={2} />
                {readingTimeLabel(readingMinutes)}
              </Badge>
            </li>
          ) : null}
          {authorName ? <li>{authorName}</li> : null}
        </ul>
      </div>

      {image ? (
        <AspectRatio data-vt-detail ratio={16 / 9} className="overflow-hidden rounded-xl bg-photo">
          <ShopImage
            src={image.url}
            alt={image.altText ?? ""}
            width={image.width ?? IMAGE_FALLBACK_WIDTH}
            height={image.height ?? IMAGE_FALLBACK_HEIGHT}
            sizes={IMAGE_SIZES}
            widths={IMAGE_WIDTHS}
            priority
            className="size-full object-cover"
          />
        </AspectRatio>
      ) : null}
    </header>
  );
}
